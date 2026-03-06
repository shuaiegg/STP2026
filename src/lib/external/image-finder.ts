
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

        // Since source.unsplash.com is deprecated, we will use a reliable high-res placeholder service
        // in combination with search terms for demonstration until an API key is connected.
        return Array.from({ length: count }).map((_, i) => {
            // Using placeholder.com or similar reliable services that still allow keyword seeds
            // Note: Unsplash requires an API Key for proper keyword search now. 
            // We use a robust fallback for the demo.
            return {
                url: `https://loremflickr.com/1200/800/${cleanKeyword}?lock=${timestamp + i}`,
                thumb: `https://loremflickr.com/400/300/${cleanKeyword}?lock=${timestamp + i}`,
                alt: `${keyword} - Contextual Image ${i + 1}`,
                credit: "LoremFlickr (Unsplash Alternative)"
            };
        });
    }
}
