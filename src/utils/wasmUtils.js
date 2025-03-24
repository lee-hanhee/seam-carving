/**
 * WebAssembly Interaction Utilities
 *
 * This module provides utility functions for interacting with the WebAssembly
 * module that implements the seam carving algorithm. It handles:
 * - Image data conversion between JavaScript and WebAssembly
 * - Memory management for image processing
 * - Error handling and validation
 *
 * Key functions:
 * - imageToWasm: Converts JavaScript ImageData to WebAssembly memory
 * - wasmToImage: Converts WebAssembly memory back to JavaScript ImageData
 * - processImage: Main function for seam carving operations
 *
 * The module serves as a bridge between the JavaScript frontend
 * and the C-based WebAssembly implementation.
 *
 * Dependencies:
 * - WebAssembly module (seamcarving.wasm)
 * - ImageData API
 */

// Helper functions for WebAssembly integration

// Initialize the WASM module
let wasmModule = null;

// Function to load the WASM module
export const initWasmModule = () => {
  return new Promise((resolve, reject) => {
    // Check if the module is already loaded
    if (wasmModule) {
      resolve(wasmModule);
      return;
    }

    // The Module object is created by the emscripten-generated seamcarving.js
    const moduleLoadPromise = new Promise((moduleResolve) => {
      window.Module = {
        onRuntimeInitialized: () => {
          moduleResolve(window.Module);
        },
        print: (text) => console.log(text),
        printErr: (text) => console.error(text),
      };
    });

    // Dynamically load the seamcarving.js script
    const script = document.createElement("script");
    script.src = "/seamcarving.js";
    script.async = true;
    script.onload = () => {
      moduleLoadPromise.then((module) => {
        wasmModule = module;
        // Create function wrappers
        wasmModule.seam_carve = module.cwrap("seam_carve", "number", [
          "number",
          "number",
          "number",
        ]);
        wasmModule.create_image = module.cwrap("create_image", "number", [
          "number",
          "number",
        ]);
        wasmModule.free_image = module.cwrap("free_image", null, ["number"]);
        wasmModule.calc_energy = module.cwrap("calc_energy", null, [
          "number",
          "number",
          "number",
          "number",
        ]);
        wasmModule.get_width = module.cwrap("get_width", "number", [
          "number",
          "number",
        ]);
        wasmModule.get_height = module.cwrap("get_height", "number", [
          "number",
          "number",
        ]);

        resolve(wasmModule);
      });
    };
    script.onerror = () => {
      reject(new Error("Failed to load WebAssembly module"));
    };

    document.body.appendChild(script);
  });
};

// Function to process an image with the seam carving algorithm
export const processImage = async (imageData) => {
  try {
    const module = await initWasmModule();

    const { width, height, data } = imageData;

    // Allocate memory for the input image
    const inputPtr = module._malloc(width * height * 4);

    // Copy image data to the WASM memory
    const heapBytes = new Uint8Array(
      module.HEAPU8.buffer,
      inputPtr,
      width * height * 4
    );
    heapBytes.set(data);

    // Call the seam carving function
    const outputPtr = module.seam_carve(inputPtr, height, width);

    // Create a new ImageData object with the result
    const newWidth = width - 1;
    const resultData = new Uint8ClampedArray(
      module.HEAPU8.buffer.slice(outputPtr, outputPtr + newWidth * height * 4)
    );

    // Clean up memory
    module._free(inputPtr);
    module._free(outputPtr);

    return new ImageData(resultData, newWidth, height);
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
};

// Helper function to convert an HTML Image to ImageData
export const getImageDataFromImage = (img) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0);

  return ctx.getImageData(0, 0, img.width, img.height);
};

// Helper function to convert ImageData to a data URL
export const getDataURLFromImageData = (imageData) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = imageData.width;
  canvas.height = imageData.height;

  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL("image/png");
};
