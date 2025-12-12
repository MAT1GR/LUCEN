// src/lib/meta.ts

/**
 * Initializes the Meta Pixel with the ID from environment variables.
 * This should be called once when the application starts.
 */
export const init = () => {
    const pixelId = import.meta.env.VITE_META_PIXEL_ID;
    if (pixelId && (window as any).fbq) {
        (window as any).fbq('init', pixelId);
    }
};

/**
 * Tracks a standard Meta Pixel event.
 * @param eventName The name of the standard event (e.g., 'ViewContent', 'AddToCart').
 * @param data Optional data payload for the event.
 * @param eventId Optional unique ID for event deduplication.
 */
export const track = (eventName: string, data?: object, eventId?: string) => {
    // Fire the Meta Pixel event
    if ((window as any).fbq) {
        if (eventId) {
            (window as any).fbq('track', eventName, data, { eventID: eventId });
        } else {
            (window as any).fbq('track', eventName, data);
        }
    }

    // Log the event to our own backend
    fetch('/api/analytics/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event_name: eventName,
            event_data: data
        }),
    }).catch(error => {
        console.error(`Failed to log analytics event ${eventName}:`, error);
    });
};
