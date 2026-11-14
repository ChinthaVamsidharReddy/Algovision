#include <algorithm>
#include <climits>
#include <vector>

int minPathSum(std::vector<std::vector<int>> grid) {     // @a entry
    int rows = static_cast<int>(grid.size());
    int cols = static_cast<int>(grid[0].size());
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (r == 0 && c == 0) continue;              // @a start
            int up = r > 0 ? grid[r - 1][c] : INT_MAX;   // @a best
            int left = c > 0 ? grid[r][c - 1] : INT_MAX; // @a best
            grid[r][c] += std::min(up, left);            // @a add
        }
    }
    return grid[rows - 1][cols - 1];                     // @a finish
}
