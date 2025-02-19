#!/bin/bash

# Load environment variables
source .env

# Function to make authenticated API calls
make_api_call() {
    local endpoint="$1"
    local method="$2"
    local data="$3"
    local auth_header="Authorization: Bearer $ACCESS_TOKEN"
    
    response=$(curl -s -X "$method" \
        -H "Content-Type: application/json" \
        -H "$auth_header" \
        --data "$data" \
        "https://bandcamp.com/api$endpoint")
    
    echo "$response"
}

# Function to authenticate and get token
authenticate() {
    echo "Authenticating with Bandcamp..."
    
    local response=$(curl -s -X POST \
        -H "Content-Type: application/x-www-form-urlencoded" \
        --data-urlencode "grant_type=client_credentials" \
        --data-urlencode "client_id=$NEXT_PUBLIC_BANDCAMP_CLIENT_ID" \
        --data-urlencode "client_secret=$BANDCAMP_CLIENT_SECRET" \
        --data-urlencode "scope=sales" \
        "https://bandcamp.com/oauth/token")
    
    # Extract access token
    ACCESS_TOKEN=$(echo "$response" | jq -r '.access_token')
    
    if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
        echo "Failed to authenticate with Bandcamp"
        exit 1
    fi
    
    echo "Successfully authenticated"
}

# Function to create a sale in Payload
create_sale() {
    local sale_data="$1"
    
    # Extract values from sale data
    local transaction_id=$(echo "$sale_data" | jq -r '.bandcamp_transaction_id')
    local item_name=$(echo "$sale_data" | jq -r '.item_name')
    local artist=$(echo "$sale_data" | jq -r '.artist')
    local amount=$(echo "$sale_data" | jq -r '.item_total')
    local currency=$(echo "$sale_data" | jq -r '.currency')
    local date=$(echo "$sale_data" | jq -r '.date')
    local country=$(echo "$sale_data" | jq -r '.country')
    local city=$(echo "$sale_data" | jq -r '.city')
    local package=$(echo "$sale_data" | jq -r '.package')
    local item_type=$(echo "$sale_data" | jq -r '.item_type')
    
    # Check if sale already exists
    local check_existing=$(curl -s -X GET \
        -H "Content-Type: application/json" \
        "${PAYLOAD_URL}/api/sales?where[bandcampOrderId][equals]=${transaction_id}")
    
    local total_docs=$(echo "$check_existing" | jq -r '.totalDocs')
    
    if [ "$total_docs" -eq 0 ]; then
        # Determine item type
        local sale_type="merch"
        if [[ "$item_type" =~ ^(track|album)$ ]]; then
            sale_type="digital"
        elif [ "$item_type" = "package" ]; then
            if [[ "$package" =~ vinyl|lp|cd|record ]]; then
                sale_type="record"
            fi
        fi
        
        # Create sale in Payload
        local payload_data="{
            \"bandcampOrderId\": \"$transaction_id\",
            \"itemName\": \"$artist - $item_name\",
            \"type\": \"$sale_type\",
            \"amount\": $amount,
            \"currency\": \"$currency\",
            \"soldAt\": \"$date\",
            \"platform\": \"bandcamp\",
            \"customerLocation\": \"$city, $country\",
            \"notes\": \"Package: $package\"
        }"
        
        curl -s -X POST \
            -H "Content-Type: application/json" \
            --data "$payload_data" \
            "${PAYLOAD_URL}/api/sales"
        
        echo "Created new sale: $transaction_id ($item_name)"
    else
        echo "Skipping duplicate sale: $transaction_id ($item_name)"
    fi
}

# Main script
echo "Starting Bandcamp sales sync..."

# Authenticate
authenticate

# Get current date and yesterday's date in ISO format
end_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
start_date=$(date -u -d "yesterday" +"%Y-%m-%dT%H:%M:%SZ")

echo "Fetching sales from $start_date to $end_date"

# Fetch bands
bands_response=$(make_api_call "/account/1/my_bands" "POST" "{}")
bands=$(echo "$bands_response" | jq -c '.bands[]')

# Process each band
while IFS= read -r band; do
    band_id=$(echo "$band" | jq -r '.band_id')
    band_name=$(echo "$band" | jq -r '.name')
    
    echo "Processing band: $band_name"
    
    # Fetch sales for band
    sales_data="{
        \"band_id\": $band_id,
        \"start_time\": \"$start_date\",
        \"end_time\": \"$end_date\"
    }"
    
    sales_response=$(make_api_call "/sales/4/sales_report" "POST" "$sales_data")
    sales=$(echo "$sales_response" | jq -c '.report[]')
    
    # Process each sale
    while IFS= read -r sale; do
        if [ ! -z "$sale" ]; then
            create_sale "$sale"
        fi
    done <<< "$sales"
    
done <<< "$bands"

echo "Sync completed" 