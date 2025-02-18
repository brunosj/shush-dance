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
) => {
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
