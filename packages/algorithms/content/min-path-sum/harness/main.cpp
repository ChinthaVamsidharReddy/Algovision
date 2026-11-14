#include <iostream>
#include <vector>
#include "solution.cpp"

int main() {
    int cases;
    std::cin >> cases;
    while (cases--) {
        int rows, cols;
        std::cin >> rows >> cols;
        std::vector<std::vector<int>> grid(rows, std::vector<int>(cols));
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) std::cin >> grid[r][c];
        }
        std::cout << minPathSum(grid) << '\n';
    }
    return 0;
}
