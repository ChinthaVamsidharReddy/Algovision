#include <queue>
#include <utility>
#include <vector>

int rottingMinutes(std::vector<std::vector<int>> grid) {   // @a entry
    int rows = static_cast<int>(grid.size());
    int cols = rows == 0 ? 0 : static_cast<int>(grid[0].size());
    std::queue<std::pair<int, int>> queue;
    int fresh = 0;
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == 2) queue.push({r, c});     // @a init
            else if (grid[r][c] == 1) fresh++;           // @a init
        }
    }
    const int dr[4] = {1, -1, 0, 0};
    const int dc[4] = {0, 0, 1, -1};
    int minutes = 0;
    while (!queue.empty() && fresh > 0) {                // @a round
        minutes++;                                       // @a round
        for (int size = static_cast<int>(queue.size()); size > 0; size--) {
            std::pair<int, int> cur = queue.front();
            queue.pop();
            for (int k = 0; k < 4; k++) {
                int nr = cur.first + dr[k];              // @a check
                int nc = cur.second + dc[k];             // @a check
                if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && grid[nr][nc] == 1) {   // @a check
                    grid[nr][nc] = 2;                    // @a rot
                    fresh--;                             // @a rot
                    queue.push({nr, nc});                // @a rot
                }
            }
        }
    }
    return fresh == 0 ? minutes : -1;                    // @a finish
}
