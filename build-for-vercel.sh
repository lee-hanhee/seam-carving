#!/bin/bash

echo "Building Seam Carving App for Vercel deployment..."

# Clean any previous build
rm -rf dist

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the project
echo "Building the application..."
npm run build

# Create a placeholder for WebAssembly files
mkdir -p dist/wasm
touch dist/wasm/seamcarving.wasm

echo "Build complete! Your app is ready to be deployed to Vercel."
echo "To deploy manually, run: vercel"
echo "For automatic deployment, push to your connected Git repository." 