#include <vector>

std::vector<int> spiralOrder(const std::vector<std::vector<int>>& grid) {   // @a entry
    int rows = static_cast<int>(grid.size());
    int cols = rows == 0 ? 0 : static_cast<int>(grid[0].size());
    std::vector<int> out;
    int top = 0, bottom = rows - 1, left = 0, right = cols - 1;   // @a init
    while (top <= bottom && left <= right) {             // @a layer
        for (int c = left; c <= right; c++) out.push_back(grid[top][c]);   // @a top
        top++;                                           // @a top
        for (int r = top; r <= bottom; r++) out.push_back(grid[r][right]); // @a right
        right--;                                         // @a right
        if (top <= bottom) {                             // @a bottom
            for (int c = right; c >= left; c--) out.push_back(grid[bottom][c]);   // @a bottom
            bottom--;                                    // @a bottom
        }
        if (left <= right) {                             // @a left
            for (int r = bottom; r >= top; r--) out.push_back(grid[r][left]);     // @a left
            left++;                                      // @a left
        }
    }
    return out;                                          // @a finish
}
