class Area {
    static int maxArea(int[][] grid) {                       // @a entry
        int rows = grid.length;
        int cols = rows == 0 ? 0 : grid[0].length;
        boolean[][] seen = new boolean[rows][cols];
        int best = 0;                                   // @a init
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1 && !seen[r][c]) {    // @a scan
                    int size = area(grid, seen, r, c);   // @a record
                    best = Math.max(best, size);         // @a record
                }
            }
        }
        return best;                                    // @a finish
    }

    static int area(int[][] grid, boolean[][] seen, int r, int c) {
        seen[r][c] = true;                               // @a visit
        int size = 1;                                    // @a visit
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        for (int[] d : dirs) {
            int nr = r + d[0];                           // @a check
            int nc = c + d[1];                           // @a check
            if (nr >= 0 && nc >= 0 && nr < grid.length && nc < grid[0].length
                    && grid[nr][nc] == 1 && !seen[nr][nc]) {   // @a check
                    size += area(grid, seen, nr, nc);        // @a spread
            }
        }
        return size;
    }
}
