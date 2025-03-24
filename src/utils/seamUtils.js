/**
 * Seam Carving Utilities
 *
 * This module provides utility functions for calculating and validating
 * seam carving operations. It handles the mathematical and logical aspects
 * of determining how many seams to remove and whether the operation is safe.
 *
 * Key functions:
 * - calculateSeamsToRemove: Determines the number of seams to remove
 * - validateSeamReduction: Ensures the reduction is within safe limits
 *
 * The module works in conjunction with the WebAssembly implementation
 * to ensure safe and efficient seam carving operations.
 *
 * Dependencies:
 * - None (pure JavaScript implementation)
 */

/**
 * Calculates the number of seams to remove based on image dimensions and desired reduction percentage
 *
 * @param {number} imageWidth - Original image width in pixels
 * @param {number} imageHeight - Original image height in pixels
 * @param {number} percentWidthReduction - Percentage of width to reduce (0-100)
 * @param {number} percentHeightReduction - Percentage of height to reduce (0-100)
 * @returns {Object} Object containing calculated vertical and horizontal seam counts
 */
export const calculateSeamsToRemove = (
  imageWidth,
  imageHeight,
  percentWidthReduction = 0,
  percentHeightReduction = 0
) => {
  // Calculate maximum possible seams for each dimension
  const maxVerticalSeams = imageWidth - 1;
  const maxHorizontalSeams = imageHeight - 1;

  // Calculate desired seams based on percentage
  const desiredVerticalSeams = Math.floor(
    imageWidth * (percentWidthReduction / 100)
  );
  const desiredHorizontalSeams = Math.floor(
    imageHeight * (percentHeightReduction / 100)
  );

  // Ensure we don't exceed maximum safe values
  const verticalSeamsToRemove = Math.min(
    desiredVerticalSeams,
    maxVerticalSeams
  );
  const horizontalSeamsToRemove = Math.min(
    desiredHorizontalSeams,
    maxHorizontalSeams
  );

  // Calculate actual reduction percentage after applying limits
  const actualWidthReductionPercent =
    (verticalSeamsToRemove / imageWidth) * 100;
  const actualHeightReductionPercent =
    (horizontalSeamsToRemove / imageHeight) * 100;

  // Calculate new dimensions after seam removal
  const newWidth = imageWidth - verticalSeamsToRemove;
  const newHeight = imageHeight - horizontalSeamsToRemove;

  // Check if requested percentage is too high
  const isWidthReductionTooHigh = desiredVerticalSeams > maxVerticalSeams;
  const isHeightReductionTooHigh = desiredHorizontalSeams > maxHorizontalSeams;

  return {
    verticalSeamsToRemove,
    horizontalSeamsToRemove,
    maxVerticalSeams,
    maxHorizontalSeams,
    actualWidthReductionPercent,
    actualHeightReductionPercent,
    isWidthReductionTooHigh,
    isHeightReductionTooHigh,
    newWidth,
    newHeight,
  };
};

/**
 * Validates if the requested seam reduction is reasonable
 *
 * @param {number} imageWidth - Original image width in pixels
 * @param {number} imageHeight - Original image height in pixels
 * @param {number} percentWidthReduction - Percentage of width to reduce (0-100)
 * @param {number} percentHeightReduction - Percentage of height to reduce (0-100)
 * @returns {Object} Validation result with success flag and error message if any
 */
export const validateSeamReduction = (
  imageWidth,
  imageHeight,
  percentWidthReduction = 0,
  percentHeightReduction = 0
) => {
  // Don't allow more than 80% reduction as a reasonable limit
  const MAX_REASONABLE_REDUCTION_PERCENT = 80;

  if (percentWidthReduction > MAX_REASONABLE_REDUCTION_PERCENT) {
    return {
      valid: false,
      message: `Width reduction of ${percentWidthReduction}% is too high. Maximum recommended is ${MAX_REASONABLE_REDUCTION_PERCENT}%.`,
    };
  }

  if (percentHeightReduction > MAX_REASONABLE_REDUCTION_PERCENT) {
    return {
      valid: false,
      message: `Height reduction of ${percentHeightReduction}% is too high. Maximum recommended is ${MAX_REASONABLE_REDUCTION_PERCENT}%.`,
    };
  }

  // Minimum reasonable size after reduction (at least 10 pixels in each dimension)
  const MIN_DIMENSION = 10;
  const newWidth =
    imageWidth - Math.floor(imageWidth * (percentWidthReduction / 100));
  const newHeight =
    imageHeight - Math.floor(imageHeight * (percentHeightReduction / 100));

  if (newWidth < MIN_DIMENSION) {
    return {
      valid: false,
      message: `Resulting width (${newWidth}px) would be too small. Please use a lower reduction percentage.`,
    };
  }

  if (newHeight < MIN_DIMENSION) {
    return {
      valid: false,
      message: `Resulting height (${newHeight}px) would be too small. Please use a lower reduction percentage.`,
    };
  }

  return { valid: true };
};
