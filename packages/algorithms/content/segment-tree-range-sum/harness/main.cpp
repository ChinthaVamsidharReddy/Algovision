#include <iostream>
#include <vector>
#include "solution.cpp"

int main() {
    int cases;
    std::cin >> cases;
    while (cases--) {
        int n;
        std::cin >> n;
        std::vector<int> values(n);
        for (int i = 0; i < n; i++) std::cin >> values[i];
        int left;
        std::cin >> left;
        int right;
        std::cin >> right;
        std::cout << segmentTreeRangeSum(values.data(), n, left, right) << '\n';
    }
    return 0;
}
