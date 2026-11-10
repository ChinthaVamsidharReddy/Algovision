#include <iostream>
#include "solution.cpp"

int main() {
    int cases;
    std::cin >> cases;
    while (cases--) {
        int rows;
        std::cin >> rows;
        int cols;
        std::cin >> cols;
        std::cout << uniquePaths(rows, cols) << '\n';
    }
    return 0;
}
