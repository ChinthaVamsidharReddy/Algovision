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
        std::vector<int> res = spiralOrder(grid);
        std::cout << res.size();
        for (int x : res) std::cout << ' ' << x;
        std::cout << '\n';
    }
    return 0;
}
