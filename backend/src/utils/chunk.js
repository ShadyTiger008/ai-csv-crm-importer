/**
 * Splits an array into smaller chunks of a specified size.
 * Useful for batching raw records for AI processing.
 * 
 * @param {Array} array - The source array.
 * @param {number} size - The size of each chunk.
 * @returns {Array[]} Array of chunks.
 */
export function chunkArray(array, size) {
  if (!Array.isArray(array)) {
    throw new TypeError("Expected an array as the first argument.");
  }
  if (typeof size !== "number" || size <= 0) {
    throw new TypeError("Expected a positive number as the chunk size.");
  }
  
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
