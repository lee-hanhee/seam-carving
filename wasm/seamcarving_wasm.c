#include <emscripten.h>
#include <stdlib.h>
#include <stdint.h>
#include <math.h>

// Define structures similar to the original code but optimized for WASM
typedef struct {
    uint8_t *raster;
    int height;
    int width;
} rgb_img;

// Function to be exposed to JavaScript
EMSCRIPTEN_KEEPALIVE
uint8_t *create_image(int height, int width) {
    return (uint8_t *)malloc(height * width * 4); // RGBA format
}

EMSCRIPTEN_KEEPALIVE
void free_image(uint8_t *img) {
    free(img);
}

// Helper function to access pixels
static inline uint8_t get_pixel(uint8_t *raster, int width, int y, int x, int col) {
    return raster[4 * (y * width + x) + col];
}

// Helper function to set pixels
static inline void set_pixel(uint8_t *raster, int width, int y, int x, int r, int g, int b, int a) {
    raster[4 * (y * width + x) + 0] = r;
    raster[4 * (y * width + x) + 1] = g;
    raster[4 * (y * width + x) + 2] = b;
    raster[4 * (y * width + x) + 3] = a;
}

// Helper function to find minimum of 2 values
static inline double min_2(double e1, double e2) {
    return (e1 > e2) ? e2 : e1;
}

// Helper function to find minimum of 3 values
static inline double min_3(double e1, double e2, double e3) {
    double sub_min = min_2(e1, e2);
    return (sub_min > e3) ? e3 : sub_min;
}

// Calculate the energy map for an image
EMSCRIPTEN_KEEPALIVE
void calc_energy(uint8_t *src, uint8_t *dest, int height, int width) {
    int w = width;
    int h = height;
    
    for (int j = 0; j < h; j++) {
        for (int i = 0; i < w; i++) {
            int k_left = (i == 0) ? w - 1 : i - 1;
            int k_right = (i == w - 1) ? 0 : i + 1;
            int k_up = (j == 0) ? h - 1 : j - 1;
            int k_down = (j == h - 1) ? 0 : j + 1;
            
            // Calculate gradient in x direction
            int r_x = get_pixel(src, w, j, k_right, 0) - get_pixel(src, w, j, k_left, 0);
            int g_x = get_pixel(src, w, j, k_right, 1) - get_pixel(src, w, j, k_left, 1);
            int b_x = get_pixel(src, w, j, k_right, 2) - get_pixel(src, w, j, k_left, 2);
            
            // Calculate gradient in y direction
            int r_y = get_pixel(src, w, k_up, i, 0) - get_pixel(src, w, k_down, i, 0);
            int g_y = get_pixel(src, w, k_up, i, 1) - get_pixel(src, w, k_down, i, 1);
            int b_y = get_pixel(src, w, k_up, i, 2) - get_pixel(src, w, k_down, i, 2);
            
            // Calculate energy
            int grad_x_2 = r_x * r_x + g_x * g_x + b_x * b_x;
            int grad_y_2 = r_y * r_y + g_y * g_y + b_y * b_y;
            
            int energy = sqrt(grad_x_2 + grad_y_2);
            int energy_norm = energy / 10;
            
            // Store energy as grayscale
            set_pixel(dest, w, j, i, energy_norm, energy_norm, energy_norm, 255);
        }
    }
}

// Main seam carving function that performs all steps
EMSCRIPTEN_KEEPALIVE
uint8_t *seam_carve(uint8_t *src, int height, int width) {
    // Create an energy map
    uint8_t *energy_map = (uint8_t *)malloc(height * width * 4);
    calc_energy(src, energy_map, height, width);
    
    // Create an array to store the cumulative minimum energy
    double *best_arr = (double *)malloc(height * width * sizeof(double));
    
    // Initialize the first row with the energy values
    for (int i = 0; i < width; i++) {
        best_arr[i] = get_pixel(energy_map, width, 0, i, 0);
    }
    
    // Fill in the rest of the DP table
    for (int j = 1; j < height; j++) {
        for (int i = 0; i < width; i++) {
            double cur = get_pixel(energy_map, width, j, i, 0);
            double min;
            
            if (i == 0) {
                // Leftmost column
                double e1 = best_arr[(j - 1) * width + i + 1];
                double e2 = best_arr[(j - 1) * width + i];
                min = min_2(e1, e2);
            }
            else if (i == width - 1) {
                // Rightmost column
                double e1 = best_arr[(j - 1) * width + i];
                double e2 = best_arr[(j - 1) * width + i - 1];
                min = min_2(e1, e2);
            }
            else {
                // Middle columns
                double e1 = best_arr[(j - 1) * width + i - 1];
                double e2 = best_arr[(j - 1) * width + i];
                double e3 = best_arr[(j - 1) * width + i + 1];
                min = min_3(e1, e2, e3);
            }
            
            best_arr[j * width + i] = cur + min;
        }
    }
    
    // Find the seam path
    int *path = (int *)malloc(height * sizeof(int));
    
    // Find the minimum energy value in the last row
    double min_energy = best_arr[(height - 1) * width];
    int min_idx = 0;
    
    for (int i = 1; i < width; i++) {
        if (best_arr[(height - 1) * width + i] < min_energy) {
            min_energy = best_arr[(height - 1) * width + i];
            min_idx = i;
        }
    }
    path[height - 1] = min_idx;
    
    // Backtrack to find the path
    for (int j = height - 2; j >= 0; j--) {
        int prev_idx = path[j + 1];
        min_idx = prev_idx;
        min_energy = best_arr[j * width + prev_idx];
        
        if (prev_idx > 0) {
            if (best_arr[j * width + prev_idx - 1] < min_energy) {
                min_energy = best_arr[j * width + prev_idx - 1];
                min_idx = prev_idx - 1;
            }
        }
        
        if (prev_idx < width - 1) {
            if (best_arr[j * width + prev_idx + 1] < min_energy) {
                min_energy = best_arr[j * width + prev_idx + 1];
                min_idx = prev_idx + 1;
            }
        }
        
        path[j] = min_idx;
    }
    
    // Create the output image with one less column
    uint8_t *output = (uint8_t *)malloc(height * (width - 1) * 4);
    
    // Copy pixels, skipping the seam
    for (int j = 0; j < height; j++) {
        int new_col = 0;
        for (int i = 0; i < width; i++) {
            if (i != path[j]) {
                set_pixel(output, width - 1, j, new_col, 
                         get_pixel(src, width, j, i, 0),
                         get_pixel(src, width, j, i, 1),
                         get_pixel(src, width, j, i, 2),
                         get_pixel(src, width, j, i, 3));
                new_col++;
            }
        }
    }
    
    // Free allocated memory
    free(energy_map);
    free(best_arr);
    free(path);
    
    return output;
}

// Helper function to get image dimensions
EMSCRIPTEN_KEEPALIVE
int get_width(uint8_t *img, int width) {
    return width;
}

EMSCRIPTEN_KEEPALIVE
int get_height(uint8_t *img, int height) {
    return height;
} 