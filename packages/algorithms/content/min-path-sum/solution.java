class MinPath {
    static int minPathSum(int[][] grid) {                // @a entry
        int rows = grid.length;
        int cols = grid[0].length;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (r == 0 && c == 0) continue;          // @a start
                int up = r > 0 ? grid[r - 1][c] : Integer.MAX_VALUE;     // @a best
                int left = c > 0 ? grid[r][c - 1] : Integer.MAX_VALUE;   // @a best
                grid[r][c] += Math.min(up, left);        // @a add
            }
        }
        return grid[rows - 1][cols - 1];                 // @a finish
    }
}
