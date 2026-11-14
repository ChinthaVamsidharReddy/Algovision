class Spiral {
    static int[] spiral(int[][] grid) {                  // @a entry
        int rows = grid.length;
        int cols = rows == 0 ? 0 : grid[0].length;
        int[] out = new int[rows * cols];
        int k = 0;
        int top = 0, bottom = rows - 1, left = 0, right = cols - 1;   // @a init
        while (top <= bottom && left <= right) {         // @a layer
            for (int c = left; c <= right; c++) out[k++] = grid[top][c];   // @a top
            top++;                                       // @a top
            for (int r = top; r <= bottom; r++) out[k++] = grid[r][right]; // @a right
            right--;                                     // @a right
            if (top <= bottom) {                         // @a bottom
                for (int c = right; c >= left; c--) out[k++] = grid[bottom][c];   // @a bottom
                bottom--;                                // @a bottom
            }
            if (left <= right) {                         // @a left
                for (int r = bottom; r >= top; r--) out[k++] = grid[r][left];     // @a left
                left++;                                  // @a left
            }
        }
        return out;                                      // @a finish
    }
}
