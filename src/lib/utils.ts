// src/lib/utils.ts

/**
 * Generates a unique event ID for Meta Pixel deduplication.
 * @returns A unique string identifier.
 */
export const generateEventId = (): string => {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};
