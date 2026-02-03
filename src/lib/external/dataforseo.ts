/**
 * DataForSEO External API Client
 */

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

/**
 * Interface for Map Data Item
 */
export interface MapDataItem {
    title: string;
    description?: string;
    rating?: number;
    reviews_count?: number;
    address?: string;
    website?: string;
    phone?: string;
    category?: string;
    latitude?: number;
    longitude?: number;
}

/**
 * DataForSEO Client
 */
export class DataForSEOClient {
    private static baseUrl = 'https://api.dataforseo.com/v3';

    /**
     * Get basic auth header
     */
    private static getAuthHeader(): string {
        const credentials = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');
        return `Basic ${credentials}`;
    }

    /**
     * Search Google Maps for local businesses
     * 
     * @param keyword Business keyword (e.g. "dental clinic in New York")
     * @param locationName Location name (optional)
     * @param limit Number of results
     */
    static async searchGoogleMaps(
        keyword: string, 
        locationName?: string, 
        limit: number = 5
    ): Promise<MapDataItem[]> {
        if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
            console.warn('DataForSEO credentials missing');
            return [];
        }

        try {
            const payload = [{
                keyword,
                location_name: locationName,
                language_name: "English",
                device: "desktop",
                os: "windows"
            }];

            const response = await fetch(`${this.baseUrl}/business_data/google/search/live`, {
                method: 'POST',
                headers: {
                    'Authorization': this.getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`DataForSEO error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.tasks && data.tasks[0] && data.tasks[0].result) {
                const results = data.tasks[0].result[0].items || [];
                return results.slice(0, limit).map((item: any) => ({
                    title: item.title,
                    description: item.description,
                    rating: item.rating?.value,
                    reviews_count: item.rating?.votes_count,
                    address: item.address,
                    website: item.url,
                    phone: item.phone,
                    category: item.category,
                    latitude: item.latitude,
                    longitude: item.longitude
                }));
            }

            return [];
        } catch (error) {
            console.error('DataForSEO search error:', error);
            return [];
        }
    }
}
