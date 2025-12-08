import { NextResponse } from 'next/server';

const EXTERNAL_ADDRESS_API = 'https://raw.githubusercontent.com/kongvut/thai-province-data/master/api/latest/province_with_district_and_sub_district.json';

let cachedData: any = null;

async function fetchWithRetry(url: string, retries: number = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

      return response;
    } catch (error) {
      console.warn(`Retry ${i + 1} failed`, error);
      if (i === retries - 1) throw error;
    }
  }
  throw new Error('Failed after retries');
}

export async function GET() {
  try {
    if (!cachedData) {
      const response = await fetchWithRetry(EXTERNAL_ADDRESS_API);
      cachedData = await response.json();
    }

    return NextResponse.json(cachedData, {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    });
  } catch (error) {
    console.error('Error in Thai Address Proxy:', error);
    return NextResponse.json(
      { error: 'Failed to load address data from server after retries.' },
      { status: 500 }
    );
  }
}
