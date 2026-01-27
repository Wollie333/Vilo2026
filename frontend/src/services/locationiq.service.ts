/**
 * LocationIQ Service
 *
 * Provides address autocomplete and geocoding via LocationIQ API
 * Free tier: 10,000 requests/day
 */

const LOCATIONIQ_API_KEY = import.meta.env.VITE_LOCATIONIQ_API_KEY;
const LOCATIONIQ_BASE_URL = 'https://api.locationiq.com/v1';

export interface LocationIQAddress {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

export interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  lat: number;
  lng: number;
}

/**
 * Search for addresses using autocomplete
 */
export const searchAddresses = async (query: string): Promise<LocationIQAddress[]> => {
  if (!query || query.trim().length < 3) {
    return [];
  }

  if (!LOCATIONIQ_API_KEY) {
    console.warn('LocationIQ API key not configured');
    return [];
  }

  try {
    const response = await fetch(
      `${LOCATIONIQ_BASE_URL}/autocomplete?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(query)}&limit=5&dedupe=1`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`LocationIQ API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('LocationIQ autocomplete error:', error);
    return [];
  }
};

/**
 * Parse a LocationIQ address into our standard format
 */
export const parseAddress = (location: LocationIQAddress): ParsedAddress => {
  const addr = location.address;

  // Build street address from house_number + road
  let street = '';
  if (addr.house_number && addr.road) {
    street = `${addr.house_number} ${addr.road}`;
  } else if (addr.road) {
    street = addr.road;
  }

  // Get city (can be in city, town, or village field)
  const city = addr.city || addr.town || addr.village || '';

  // Get state/province
  const state = addr.state || addr.county || '';

  // Get postal code
  const postal_code = addr.postcode || '';

  // Get country
  const country = addr.country || '';

  return {
    street: street.trim(),
    city: city.trim(),
    state: state.trim(),
    postal_code: postal_code.trim(),
    country: country.trim(),
    lat: parseFloat(location.lat),
    lng: parseFloat(location.lon),
  };
};

export const locationiqService = {
  searchAddresses,
  parseAddress,
};

export default locationiqService;
