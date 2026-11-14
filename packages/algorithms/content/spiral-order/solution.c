int spiral_order(const int *grid, int rows, int cols, int *out) {   // @a entry
    int k = 0;
    int top = 0, bottom = rows - 1, left = 0, right = cols - 1;   // @a init
    while (top <= bottom && left <= right) {             // @a layer
        for (int c = left; c <= right; c++) out[k++] = grid[top * cols + c];   // @a top
        top++;                                           // @a top
        for (int r = top; r <= bottom; r++) out[k++] = grid[r * cols + right]; // @a right
        right--;                                         // @a right
        if (top <= bottom) {                             // @a bottom
            for (int c = right; c >= left; c--) out[k++] = grid[bottom * cols + c];   // @a bottom
            bottom--;                                    // @a bottom
        }
        if (left <= right) {                             // @a left
            for (int r = bottom; r >= top; r--) out[k++] = grid[r * cols + left];     // @a left
            left++;                                      // @a left
        }
    }
    return k;                                            // @a finish
}
