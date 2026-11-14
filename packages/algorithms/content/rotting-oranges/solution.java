import java.util.ArrayDeque;

class Rotting {
    static int minutes(int[][] grid) {                   // @a entry
        int rows = grid.length;
        int cols = rows == 0 ? 0 : grid[0].length;
        ArrayDeque<int[]> queue = new ArrayDeque<>();
        int fresh = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 2) queue.add(new int[] {r, c});   // @a init
                else if (grid[r][c] == 1) fresh++;       // @a init
            }
        }
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        int minutes = 0;
        while (!queue.isEmpty() && fresh > 0) {          // @a round
            minutes++;                                   // @a round
            for (int size = queue.size(); size > 0; size--) {
                int[] cur = queue.poll();
                for (int[] d : dirs) {
                    int nr = cur[0] + d[0];              // @a check
                    int nc = cur[1] + d[1];              // @a check
                    if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && grid[nr][nc] == 1) {   // @a check
                        grid[nr][nc] = 2;                // @a rot
                        fresh--;                         // @a rot
                        queue.add(new int[] {nr, nc});   // @a rot
                    }
                }
            }
        }
        return fresh == 0 ? minutes : -1;                // @a finish
    }
}
