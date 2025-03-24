#include "seamcarving.h"
#include "c_img.h"
#include <stdio.h>
#include <math.h>
#include <stdlib.h>
#include <stdint.h>

// Part 1: Dual-Gradient Energy Function
void calc_energy(struct rgb_img *im, struct rgb_img **grad)
{
    // 1. Allocate a block of memory for the dual-gradient energy function: 
    create_img(grad, im->height, im->width);

    // 2. For-loop to compute each of the energies. 
    // 2.1 Iterating through the columns after each row is done
    // Initializing all relevant variables.
    int w = im->width;
    int h = im->height;
    int R_x = 0;
    int R_y = 0;
    int G_x = 0;
    int G_y = 0;
    int B_x = 0;
    int B_y = 0;

    int k_left = 0;
    int k_right = 0;
    int k_up = 0;
    int k_down = 0;

    int grad_x_2;
    int grad_y_2;
    int energy;
    int energy_norm;
    for(int j = 0; j < im->height; j++){

        // 2.2 Iterating through the rows
        for(int i = 0; i < im->width; i++){
            // Resets the pixel values to 0 after each iteration of one pixel. 
            
            // 2.3 Implement 4 conditions when it's on the edge: i = 0, i = width - 1, j = 0, j = height - 1:  
            if(i == 0){
                k_left = w - 1;
            }
            else{
                k_left = i - 1; 
            }

            if(i == (w - 1)){
                k_right = 0; 
            }
            else{
                k_right = i + 1; 
            }

            if(j == 0){
                k_up = h - 1; 
            }
            else{
                k_up = j - 1;
            }

            if(j == (h - 1)){
                k_down = 0; 
            }
            else{
                k_down = j + 1; 
            }

            // 2.4 Calculate R_x, R_y, B_x, B_y, G_x, G_y
            R_x = get_pixel(im, j, k_right, 0) - get_pixel(im, j, k_left, 0);
            G_x = get_pixel(im, j, k_right, 1) - get_pixel(im, j, k_left, 1);
            B_x = get_pixel(im, j, k_right, 2) - get_pixel(im, j, k_left, 2);

            R_y = get_pixel(im, k_up, i, 0) - get_pixel(im, k_down, i, 0);
            G_y = get_pixel(im, k_up, i, 1) - get_pixel(im, k_down, i, 1);
            B_y = get_pixel(im, k_up, i, 2) - get_pixel(im, k_down, i, 2);

            // 2.5 Calculate the gradients
            grad_x_2 = R_x*R_x + B_x*B_x + G_x*G_x;
            grad_y_2 = R_y*R_y + B_y*B_y + G_y*G_y;

            // 2.6 Calculate the energy and normalize it
            energy = sqrt(grad_x_2 + grad_y_2);
            energy_norm = (uint8_t)(energy / 10);

            // 2.7 Store the normalized energy in the grad struct. 
            set_pixel(*grad, j, i, energy_norm, energy_norm, energy_norm);
        }
    }
}

// Part 2: Cost Array
// Helper functions to compare the previous energies
double min_2(double e1, double e2){
    if(e1 > e2){
        return e2;
    }
    else{
        return e1;
    }
}

// Helper functions to compare the previous energies
double min_3(double e1, double e2, double e3){
    double sub_min = min_2(e1,e2);
    if(sub_min > e3){
        return e3;
    }
    else{
        return sub_min;
    }

}

void dynamic_seam(struct rgb_img *grad, double **best_arr)
{
    // 1. Set up the array
    (*best_arr) = (double *)malloc(grad->height * grad->width * sizeof(double));

    // 2. Set up the base case since the energy for the top row will be the same as in grad.
    for(int i = 0; i < grad->width; i++){
        (*best_arr)[i] = (double)get_pixel(grad, 0, i, 0); 
    }

    double e1;
    double e2;
    double e3; 
    double min;
    double cur;

    // 3. Setting up by solving the subproblems by iterating through the height
    for(int j = 1; j < grad->height; j++){

        // 4. Setting up by iterating through the width. 
        for(int i = 0; i < grad->width; i++){
            // 5. Setting up the correct boundary indices. 
            cur = (double)get_pixel(grad, j, i, 0); // Getting the current pixel at the appropriate column. 
        
            // 6. Boundary case (i.e. at the edges)
            // 1st Boundary case being on the complete LS of the picture. 
            if(i == 0){
            
                e1 = (*best_arr)[(j - 1) * grad->width + (i+1)]; // must index the one after since we are at i = 0, not on the right side
                e2 = (*best_arr)[(j - 1) * grad->width + (i)];
                min = (double)min_2(e1, e2);
            }
            
            // 2nd Boundary case being the complete RS of the picture 
            else if(i == grad->width - 1){
                
                e1 = (*best_arr)[(j - 1) * grad->width + (i)];
                e2 = (*best_arr)[(j - 1) * grad->width + (i - 1)];  // must index the one before because we are at i = grad->width - 1
                min = (double)min_2(e1, e2);
            }

            // 7. General Case:
            else{ 
                e1 = (*best_arr)[(j - 1) * grad->width + (i - 1)]; // The j skips ahead of the ith entries by width to get onto the next row. 
                e2 = (*best_arr)[(j - 1) * grad->width + (i)];
                e3 = (*best_arr)[(j - 1) * grad->width + (i + 1)];
                min = (double)min_3(e1, e2, e3);
            }

            // 8. Setting the array using the appropriate convention.
            (*best_arr)[j * grad->width + i] = cur + min; 
        }
    }
}

// Part 3: Recover the seam
void recover_path(double *best, int height, int width, int **path)
{
    // 1. Mallocing space for the path array. 
    (*path) = (int *)malloc(sizeof(int) * height);

    // 1.1 Inititate a variable that will have the column index of the current node (i.e. energy sum)
    int x_cont; 

    // 2. Iterating through the heights since the array will be the length of the height minus 1.  
        // Starting at the bottom of the row and seeing the adjcacent energies that are the minimum. 
    for(int j = height - 1; j > 0 - 1; j--){

        // 3. Setting the max value to have something to compare too. 
        double min = 10000000000000000; // Setting as an abritrary value. 

        // 3.5 setting three comparative values 
        double e1_sum = 0;
        double e2_sum = 0;
        double e3_sum = 0;
        int e1_i = 0;
        int e2_i = 0;
        int e3_i = 0;

        // 4. Comparing each value along the width to the min value of the energy. 
        for(int i = 0; i < width; i++){

            // 5. Setting up a conditional to see where we input this as the new min of the energy for the bottom row            
            if(j == height - 1){
                if(min > best[j * width + i]){ // interchanges i and j to be correct now.
                    (*path)[j] = i; // Setting the path array to the index which gives the minimum energy, and this will be the last part in the index. 
                    min = best[j * width + i]; // Setting as the new minimum to be comapred against. 
                    x_cont = i;
                }
            }

            // 6. Setting up for when its not on the bottom row, and finding the adjacent energies based on three cases.
            else{ 
                if(min > best[j * width + i]){ // should always hold true. 
                    // Check if its adjacent to the path to make it continuous by comparing with the x_cont variable. 
                    
                    // Boundary case
                    if(x_cont == 0){
                        if(i == x_cont){
                            e1_sum = best[j * width + i];
                            e1_i = i;
                        }
                        else if(i == x_cont + 1){
                            e2_sum = best[j * width + i];
                            e2_i = i;
                        }
                    }
                    // Boundary case
                    else if(x_cont == width - 1){
                        if(i == x_cont){
                            e1_sum = best[j * width + i];
                            e1_i = i;
                        }
                        else if(i == x_cont - 1){
                            e2_sum = best[j * width + i];
                            e2_i = i;
                        }
                    }
                    // General case
                    else{
                        if(i == x_cont){
                            e1_sum = best[j * width + i];
                            e1_i = i;
                        }
                        else if(i == x_cont - 1){
                            e2_sum = best[j * width + i];
                            e2_i = i;
                        }
                        else if(i == x_cont + 1){
                            e3_sum = best[j * width + i];
                            e3_i = i;
                        }
                    }
                }

                // 7. Comparing them now to see which one we should choose in the subsequent row. 
                if(i == width - 1){
                    if(e3_sum == 0){ // if this is true we know we are on one of the boundary cases
                        min = min_2(e1_sum, e2_sum);
                        // Getting the appropriate index 
                        if(min == e1_sum){
                            (*path)[j] = e1_i;
                            x_cont = e1_i;
                        }
                        else{
                            (*path)[j] = e2_i;
                            x_cont = e2_i;
                        }
                    }
                    else{
                        min = min_3(e1_sum, e2_sum, e3_sum);
                        // Getting the appropriate index 
                        if(min == e1_sum){
                            (*path)[j] = e1_i;
                            x_cont = e1_i;
                        }
                        else if(min == e2_sum){
                            (*path)[j] = e2_i;
                            x_cont = e2_i;
                        }
                        else{
                            (*path)[j] = e3_i;
                            x_cont = e3_i;
                        }
                    }
                }       
            }
        }
    }
}

// Part 4: Write a function that removes the seam 
void remove_seam(struct rgb_img *src, struct rgb_img **dest, int *path)
{
    // 1. Setting up the image 
    create_img(dest, src->height, src->width - 1);

    // 2. Initiating the appropriate variables. 
    int R;
    int B;
    int G;

    // 3. Iterating through the heights of the source.
    for(int j = 0; j < src->height; j++){
        
        // 4. Iterating through the width of the source
        for(int i = 0; i < src->width; i++){

            // 5. Basically if its in the path that we computed in the previous part, then we don't want to keep it, so we will skip over those values.
            if(i != path[j]){
                // 6. Getting the RGB values at the appropriate point. 
                R = get_pixel(src, j, i, 0);
                G = get_pixel(src, j, i, 1);
                B = get_pixel(src, j, i, 2);
                
                // 7. If the pixel is to the left of the seam, then the pixels do not need to be shifted by 1. 
                if(i < path[j]){ 
                    set_pixel(*dest, j, i, R, G, B); 
                }
                // 8. Since we are removing the pixel at index path[j] therefore we want to shift everything to the left by 1.
                else{
                    set_pixel(*dest, j, i - 1, R, G, B); 
                }
                
            }
            
        }
    }
} 