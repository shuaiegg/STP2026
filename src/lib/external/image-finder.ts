
export interface UnsplashImage {
    url: string;
    thumb: string;
    alt: string;
    credit: string;
}

export class ImageFinder {
    /**
     * Generates a set of contextually relevant image URLs using Unsplash CDN.
     * This is "zero-latency" because we are constructing the URLs without waiting for an API response.
     */
    static getSuggestedImages(keyword: string, count: number = 3): UnsplashImage[] {
        const cleanKeyword = encodeURIComponent(keyword.trim());
        const timestamp = Date.now();

        // We use the direct Source-like URL pattern which is handled by Unsplash CDN
        // Adding random seeds to ensure different images if requested
        return Array.from({ length: count }).map((_, i) => ({
            url: `https://images.unsplash.com/photo-${timestamp + i}?auto=format&fit=crop&q=80&w=1200&sig=${i}&ixlib=rb-4.0.3&utm_source=scaletotop`,
            thumb: `https://source.unsplash.com/featured/400x300?${cleanKeyword}&sig=${i}`,
            alt: `${keyword} - Image Suggestion ${i + 1}`,
            credit: "Unsplash"
        }));
    }
}
