#include <algorithm>
#include <vector>

static const int DR[4] = {1, -1, 0, 0};
static const int DC[4] = {0, 0, 1, -1};

static void flood(const std::vector<std::vector<int>>& grid, std::vector<std::vector<char>>& seen, int r, int c) {
    seen[r][c] = 1;                                      // @a visit
    int rows = static_cast<int>(grid.size());
    int cols = static_cast<int>(grid[0].size());
    for (int k = 0; k < 4; k++) {
        int nr = r + DR[k];                              // @a check
        int nc = c + DC[k];                              // @a check
        if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && grid[nr][nc] == 1 && !seen[nr][nc]) {   // @a check
            flood(grid, seen, nr, nc);                   // @a spread
        }
    }

}

int countIslands(const std::vector<std::vector<int>>& grid) {   // @a entry
    int rows = static_cast<int>(grid.size());
    int cols = rows == 0 ? 0 : static_cast<int>(grid[0].size());
    std::vector<std::vector<char>> seen(rows, std::vector<char>(cols, 0));
    int islands = 0;                                     // @a init
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == 1 && !seen[r][c]) {                // @a scan
                islands++;                                       // @a new-island
                flood(grid, seen, r, c);                         // @a new-island
            }
        }
    }
    return islands;                                      // @a finish
}
