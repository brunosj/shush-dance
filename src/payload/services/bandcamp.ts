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

const TIMEOUT_MS = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // 2 seconds

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const authenticate = async (retryCount = 0): Promise<void> => {
  console.log(
    'Starting authentication process... (attempt',
    retryCount + 1,
    'of',
    MAX_RETRIES + 1,
    ')'
  );
  console.log('Checking environment variables...');

  if (!CLIENT_ID) {
    console.error('CLIENT_ID is missing');
    throw new Error('Missing CLIENT_ID');
  }
  if (!CLIENT_SECRET) {
    console.error('CLIENT_SECRET is missing');
    throw new Error('Missing CLIENT_SECRET');
  }

  console.log('Environment variables present');

  try {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'sales',
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    console.log('Making request to Bandcamp...');
    const response = await fetch(`${BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Authentication failed: ${response.statusText} - ${errorText}`
      );
    }

    const data: TokenResponse = await response.json();
    authToken = data.access_token;
    refreshToken = data.refresh_token;
    console.log('Authentication successful');
  } catch (error) {
    console.error('Bandcamp authentication attempt failed:', error);

    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY_MS}ms...`);
      await sleep(RETRY_DELAY_MS);
      return authenticate(retryCount + 1);
    }

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
