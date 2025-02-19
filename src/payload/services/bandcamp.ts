const BASE_URL = 'https://bandcamp.com';
const CLIENT_ID = process.env.NEXT_PUBLIC_BANDCAMP_CLIENT_ID;
const CLIENT_SECRET = process.env.BANDCAMP_CLIENT_SECRET;

interface Band {
  subdomain: string;
  band_id: number;
  name: string;
  member_bands?: Band[];
}

interface BandsResponse {
  bands: Band[];
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  ok: boolean;
}

interface SaleItem {
  bandcamp_transaction_id: number;
  bandcamp_transaction_item_id: number;
  bandcamp_related_transaction_id: number | null;
  date: string;
  paid_to: string;
  item_type: string;
  item_name: string;
  artist: string;
  currency: string;
  item_price: number;
  quantity: number;
  discount_code: string | null;
  sub_total: number;
  additional_fan_contribution: number;
  seller_tax: number | null;
  marketplace_tax: number | null;
  tax_rate: number | null;
  collection_society_share: number | null;
  shipping: number | null;
  ship_from_country_name: string | null;
  transaction_fee: number;
  fee_type: string;
  item_total: number;
  amount_you_received: number;
  paypal_transaction_id: string | null;
  net_amount: number;
  package: string;
  option: string | null;
  item_url: string;
  catalog_number: string | null;
  upc: string;
  isrc: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  buyer_note: string | null;
  ship_to_name: string;
  ship_to_street: string;
  ship_to_street_2: string;
  ship_to_city: string | null;
  ship_to_state: string | null;
  ship_to_zip: string | null;
  ship_to_country: string | null;
  ship_to_country_code: string | null;
  ship_date: string | null;
  ship_notes: string | null;
  country: string;
  country_code: string;
  region_or_state: string;
  city: string;
  referer: string;
  referer_url: string;
  sku: string | null;
}

interface SalesResponse {
  report: SaleItem[];
}

let authToken: string | null = null;
let refreshToken: string | null = null;

const authenticate = async (): Promise<void> => {
  try {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
    });

    const response = await fetch(`${BASE_URL}/oauth_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    const data: TokenResponse = await response.json();
    authToken = data.access_token;
    refreshToken = data.refresh_token;
  } catch (error) {
    console.error('Bandcamp authentication failed:', error);
    throw error;
  }
};

export const fetchBands = async (): Promise<Band[]> => {
  if (!authToken) {
    await authenticate();
  }

  try {
    const response = await fetch(`${BASE_URL}/api/account/1/my_bands`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bands: ${response.statusText}`);
    }

    const data: BandsResponse = await response.json();
    return data.bands;
  } catch (error) {
    console.error('Error fetching bands:', error);
    throw error;
  }
};

export const fetchSalesForBand = async (
  bandId: number,
  startDate: Date,
  endDate: Date
): Promise<SalesResponse> => {
  if (!authToken) {
    await authenticate();
  }

  try {
    const response = await fetch(`${BASE_URL}/api/sales/4/sales_report`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        band_id: bandId,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch sales for band ${bandId}: ${response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    console.error(`Error fetching sales for band ${bandId}:`, error);
    throw error;
  }
};
