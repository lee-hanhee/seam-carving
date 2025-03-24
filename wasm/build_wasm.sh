'''
This Bash script compiles a C source file (seamcarving_wasm.c) into a WebAssembly (WASM) module using Emscripten (emcc), 
enabling the C functions to be used in a web application via JavaScript.
'''
#!/bin/bash

# Check if Emscripten is installed
if ! command -v emcc &> /dev/null; then
    echo "Emscripten (emcc) is not installed or not in PATH"
    echo "Please install Emscripten first: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

# Compile the WASM module
emcc seamcarving_wasm.c \
    -o ../public/seamcarving.js \
    -s WASM=1 \
    -s EXPORTED_RUNTIME_METHODS='["cwrap", "setValue", "getValue"]' \
    -s EXPORTED_FUNCTIONS='["_malloc", "_free", "_seam_carve", "_create_image", "_free_image", "_calc_energy", "_get_width", "_get_height"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s ENVIRONMENT='web' \
    -O3

echo "WebAssembly module built successfully!"
echo "Files generated:"
echo "  - ../public/seamcarving.js"
echo "  - ../public/seamcarving.wasm" 