/**
 * Generate a thumbnail URL from an ImageKit image URL
 * Applies transformations for optimized display
 *
 * @param {string} imageUrl - The original ImageKit image URL
 * @param {number} width - Target width
 * @param {number} height - Target height
 */
export function getThumbnailUrl(imageUrl, width = 400, height = 400) {
  if (!imageUrl) return null;

  // If URL already has transformations, return as-is
  if (imageUrl.includes("tr=")) return imageUrl;

  // Simple resize by width only - let CSS object-cover handle the aspect ratio cropping
  // This prevents ImageKit from adding any padding
  // We use the larger dimension to ensure the image is big enough
  const size = Math.max(width, height);
  const transformation = `tr=w-${size},q-85`;

  if (imageUrl.includes("?")) {
    return imageUrl.replace("?", `?${transformation}&`);
  }

  return `${imageUrl}?${transformation}`;
}

/**
 * Get the best available image URL with fallback
 * Prefers thumbnail, falls back to original with transformations
 *
 * @param {object} meal - Meal object with imageUrl and thumbnailUrl
 * @param {string} variant - Display variant: 'thumbnail' (square), 'card' (16:9), 'preview' (wide)
 */
export function getMealImageUrl(meal, variant = "thumbnail") {
  if (!meal) return null;

  // Define dimensions for different variants
  const variants = {
    thumbnail: { w: 400, h: 400 }, // Square for search results
    card: { w: 800, h: 450 }, // 16:9 for library cards
    preview: { w: 1200, h: 400 }, // Wide for detail views
  };

  const dimensions = variants[variant] || variants.thumbnail;

  // Don't use thumbnailUrl as it might have old transformations with padding
  // Always generate fresh transformation from imageUrl
  if (meal.imageUrl) {
    return getThumbnailUrl(meal.imageUrl, dimensions.w, dimensions.h);
  }

  return null;
}
