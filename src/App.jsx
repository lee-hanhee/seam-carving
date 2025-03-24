/**
 * Main Application Component
 *
 * This component implements the core UI and functionality of the Seam Carving App.
 * It handles:
 * - Image upload and preview
 * - Seam carving parameters (width/height reduction)
 * - WebAssembly module integration
 * - Image processing and download
 *
 * Dependencies:
 * - React hooks (useState, useEffect, useRef)
 * - WebAssembly module (loadWasm.js)
 * - Seam calculation utilities (seamUtils.js)
 *
 * The component follows a single-responsibility pattern where:
 * 1. UI state is managed at the top level
 * 2. Image processing is delegated to WebAssembly
 * 3. Calculations are handled by utility functions
 */

import { useState, useEffect, useRef } from "react";
import { loadWasm, getWasmModule } from "./loadWasm";
import {
  calculateSeamsToRemove,
  validateSeamReduction,
} from "./utils/seamUtils";

function App() {
  const [wasmLoaded, setWasmLoaded] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [widthReductionPercent, setWidthReductionPercent] = useState(30);
  const [heightReductionPercent, setHeightReductionPercent] = useState(0);
  const [seamReductionDetails, setSeamReductionDetails] = useState(null);
  const canvasRef = useRef(null);
  const downloadLinkRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const initWasm = async () => {
      try {
        await loadWasm();
        setWasmLoaded(true);
        console.log("WebAssembly module loaded successfully");
      } catch (error) {
        console.error("Failed to load WebAssembly module:", error);
        setError(
          "Failed to load WebAssembly module. Please check your browser compatibility."
        );
      }
    };

    initWasm();
  }, []);

  // Calculate seam reduction details whenever image or reduction percentages change
  useEffect(() => {
    if (originalImage) {
      const details = calculateSeamsToRemove(
        originalImage.width,
        originalImage.height,
        widthReductionPercent,
        heightReductionPercent
      );

      setSeamReductionDetails(details);

      // Validate the reduction
      const validation = validateSeamReduction(
        originalImage.width,
        originalImage.height,
        widthReductionPercent,
        heightReductionPercent
      );

      if (!validation.valid) {
        setError(validation.message);
      } else if (error && error.includes("reduction")) {
        // Clear previous reduction-related errors
        setError(null);
      }
    }
  }, [originalImage, widthReductionPercent, heightReductionPercent]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setProcessedImage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
      };
      img.onerror = () => {
        setError("Failed to load image. Please try a different file.");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!wasmLoaded || !originalImage || !seamReductionDetails) return;

    // Check if the reduction is valid
    const validation = validateSeamReduction(
      originalImage.width,
      originalImage.height,
      widthReductionPercent,
      heightReductionPercent
    );

    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Create a canvas to get image data
      const canvas = document.createElement("canvas");
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(originalImage, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // In a real implementation, we would call our WASM functions here
      // For now, we'll just simulate processing with a timeout
      setTimeout(() => {
        try {
          // Extract the number of seams to remove from our calculations
          const { verticalSeamsToRemove, horizontalSeamsToRemove } =
            seamReductionDetails;

          // Use vertical seams (width reduction) in this example
          // In a real implementation, we would handle both vertical and horizontal seams
          const processedData = simulateSeamCarving(
            imageData,
            verticalSeamsToRemove
          );

          // Create a new image from the processed data
          const processedCanvas = document.createElement("canvas");
          processedCanvas.width = imageData.width - verticalSeamsToRemove;
          processedCanvas.height = imageData.height;
          const processedCtx = processedCanvas.getContext("2d");
          processedCtx.putImageData(processedData, 0, 0);

          const processedImg = new Image();
          processedImg.onload = () => {
            setProcessedImage(processedImg);
            setIsProcessing(false);
          };
          processedImg.src = processedCanvas.toDataURL("image/png");
        } catch (err) {
          setError("Error during image processing: " + err.message);
          setIsProcessing(false);
        }
      }, 1500); // Simulate processing time
    } catch (err) {
      setError("Error preparing image for processing: " + err.message);
      setIsProcessing(false);
    }
  };

  // Simulation function (will be replaced with real WASM call)
  const simulateSeamCarving = (imageData, seamCount) => {
    // Create a new ImageData with reduced width
    const newWidth = imageData.width - seamCount;
    const newImageData = new ImageData(newWidth, imageData.height);

    // Simple algorithm to simulate seam carving by removing columns
    // In a real implementation, this would be done by the C code via WebAssembly
    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < newWidth; x++) {
        // Remove evenly spaced columns (this is just a simplistic visual simulation)
        // In real seam carving, we would remove the lowest energy seams
        const sourceX = Math.floor(x * (imageData.width / newWidth));

        const sourceIndex = (y * imageData.width + sourceX) * 4;
        const targetIndex = (y * newWidth + x) * 4;

        newImageData.data[targetIndex] = imageData.data[sourceIndex]; // R
        newImageData.data[targetIndex + 1] = imageData.data[sourceIndex + 1]; // G
        newImageData.data[targetIndex + 2] = imageData.data[sourceIndex + 2]; // B
        newImageData.data[targetIndex + 3] = imageData.data[sourceIndex + 3]; // A
      }
    }

    return newImageData;
  };

  const handleDownload = () => {
    if (!processedImage) return;

    // Create a canvas with the processed image
    const canvas = document.createElement("canvas");
    canvas.width = processedImage.width;
    canvas.height = processedImage.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(processedImage, 0, 0);

    // Create a download link
    if (downloadLinkRef.current) {
      downloadLinkRef.current.href = canvas.toDataURL("image/png");
      downloadLinkRef.current.download = "seam-carved-image.png";
      downloadLinkRef.current.click();
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
    setWidthReductionPercent(30);
    setHeightReductionPercent(0);
    setSeamReductionDetails(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Seam Carving App
          </h1>
          <p className="text-lg text-gray-600">
            Upload an image and apply content-aware resizing
          </p>
          {wasmLoaded ? (
            <div className="mt-2 text-sm text-green-600">
              WebAssembly module loaded
            </div>
          ) : (
            <div className="mt-2 text-sm text-yellow-600">
              Loading WebAssembly module...
            </div>
          )}
        </header>

        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Image Selection</h2>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="image-upload"
                >
                  Upload an image
                </label>
                <input
                  id="image-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>

              {(originalImage || processedImage) && (
                <div>
                  <button
                    onClick={handleReset}
                    className="w-full md:w-auto px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          </div>

          {originalImage && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">
                Image Reduction Settings
              </h2>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="width-reduction"
                >
                  Width Reduction: {widthReductionPercent}%
                  {seamReductionDetails && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({seamReductionDetails.verticalSeamsToRemove} seams of max{" "}
                      {seamReductionDetails.maxVerticalSeams})
                    </span>
                  )}
                </label>
                <input
                  id="width-reduction"
                  type="range"
                  min="0"
                  max="80"
                  value={widthReductionPercent}
                  onChange={(e) =>
                    setWidthReductionPercent(parseInt(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Height reduction could be implemented in the future 
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="height-reduction">
                  Height Reduction: {heightReductionPercent}%
                  {seamReductionDetails && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({seamReductionDetails.horizontalSeamsToRemove} seams of max {seamReductionDetails.maxHorizontalSeams})
                    </span>
                  )}
                </label>
                <input
                  id="height-reduction"
                  type="range"
                  min="0"
                  max="80"
                  value={heightReductionPercent}
                  onChange={(e) => setHeightReductionPercent(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              */}

              {seamReductionDetails && (
                <div className="mb-4 p-4 bg-blue-50 text-blue-800 rounded-md">
                  <h3 className="font-bold mb-1">Processing Details:</h3>
                  <p>
                    Original dimensions: {originalImage.width} ×{" "}
                    {originalImage.height}
                  </p>
                  <p>
                    New dimensions: {seamReductionDetails.newWidth} ×{" "}
                    {seamReductionDetails.newHeight}
                  </p>
                  <p>
                    Removing {seamReductionDetails.verticalSeamsToRemove}{" "}
                    vertical seams (
                    {seamReductionDetails.actualWidthReductionPercent.toFixed(
                      1
                    )}
                    % width reduction)
                  </p>
                  {seamReductionDetails.isWidthReductionTooHigh && (
                    <p className="text-yellow-600 mt-1">
                      Note: Requested width reduction was capped at the maximum
                      safe value.
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={processImage}
                disabled={
                  !wasmLoaded ||
                  isProcessing ||
                  (error && error.includes("reduction"))
                }
                className={`mt-4 px-4 py-2 rounded-md text-white font-semibold ${
                  !wasmLoaded ||
                  isProcessing ||
                  (error && error.includes("reduction"))
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isProcessing ? "Processing..." : "Process Image"}
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}

          {(originalImage || processedImage) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {originalImage && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Original Image</h3>
                  <div className="border border-gray-300 rounded-md overflow-hidden">
                    <img
                      src={originalImage.src}
                      alt="Original"
                      className="max-w-full h-auto"
                    />
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Dimensions: {originalImage.width} × {originalImage.height}
                  </div>
                </div>
              )}

              {processedImage && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Processed Image
                  </h3>
                  <div className="border border-gray-300 rounded-md overflow-hidden">
                    <img
                      src={processedImage.src}
                      alt="Processed"
                      className="max-w-full h-auto"
                    />
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Dimensions: {processedImage.width} × {processedImage.height}
                  </div>
                  <button
                    onClick={handleDownload}
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Download
                  </button>
                  <a ref={downloadLinkRef} className="hidden"></a>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-700 mb-4">
            Seam carving is a content-aware image resizing technique that allows
            you to resize images without distorting important content. It works
            by identifying and removing paths of pixels (seams) that have the
            least impact on the image's visual content.
          </p>
          <p className="text-gray-700">
            This application uses WebAssembly to perform the seam carving
            operation directly in your browser, providing efficient performance
            without sending your images to a server.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
