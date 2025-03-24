# Seam Carving Web App

A modern React web application for content-aware image resizing using the seam carving algorithm. This application allows users to resize images while preserving important visual content by intelligently removing low-energy seams.

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Frontend │     │  WebAssembly    │     │    Image I/O    │
│   (App.jsx)      │◄───►│  (seamcarving)  │◄───►│    (c_img)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Key Components

1. **Frontend Layer**

   - React-based UI for image upload and processing
   - Tailwind CSS for styling
   - Client-side image processing using WebAssembly

2. **Processing Layer**

   - WebAssembly module for seam carving algorithm
   - Optimized C implementation for performance
   - Energy calculation and seam finding

3. **Image Layer**
   - C-based image processing utilities
   - Handles image data conversion and manipulation
   - Provides interface between JavaScript and C

## Technologies Used

- **Frontend Framework**: React with Vite
- **Styling**: Tailwind CSS
- **Image Processing**: WebAssembly (C)
- **Build Tools**: Vite, Emscripten
- **Deployment**: Vercel

## Core Features

1. **Image Upload**

   - Support for various image formats
   - Client-side image validation
   - Preview of original image

2. **Seam Carving**

   - Content-aware image resizing
   - Percentage-based width reduction
   - Real-time seam calculation
   - Energy-based seam selection

3. **Image Processing**

   - WebAssembly-powered processing
   - No server-side processing required
   - Efficient memory management

4. **User Interface**
   - Intuitive controls for reduction percentage
   - Real-time preview of changes
   - Download processed images
   - Responsive design

## Project Structure

```
seamcarving-wasm-app/
├── src/                    # React source code
│   ├── App.jsx            # Main application component
│   ├── loadWasm.js        # WebAssembly loading utility
│   └── utils/             # Utility functions
│       ├── seamUtils.js   # Seam calculation utilities
│       └── wasmUtils.js   # WebAssembly interaction utilities
├── wasm/                  # WebAssembly source files
│   ├── seamcarving.c      # Core seam carving algorithm
│   ├── c_img.c           # Image processing utilities
│   └── build_wasm.sh     # WebAssembly build script
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Emscripten (for WebAssembly compilation)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd seamcarving-wasm-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Compile WebAssembly:

   ```bash
   cd wasm
   chmod +x build_wasm.sh
   ./build_wasm.sh
   ```

4. Start development server:

   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

## Development

### Key Files

- `src/App.jsx`: Main application component handling UI and user interactions
- `src/loadWasm.js`: Manages WebAssembly module loading and initialization
- `src/utils/seamUtils.js`: Contains utilities for seam calculation and validation
- `src/utils/wasmUtils.js`: Handles WebAssembly module interaction
- `wasm/seamcarving.c`: Core seam carving algorithm implementation
- `wasm/c_img.c`: Image processing utilities

### Adding Features

1. **UI Changes**: Modify `src/App.jsx`
2. **Algorithm Updates**: Edit `wasm/seamcarving.c`
3. **Image Processing**: Update `wasm/c_img.c`
4. **Build Process**: Modify `wasm/build_wasm.sh`

## Deployment

The application is configured for deployment on Vercel. See the deployment section in the original README for detailed instructions.

## License

MIT License
