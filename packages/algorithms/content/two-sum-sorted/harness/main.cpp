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
        int target;
        std::cin >> target;
        std::vector<int> pair = twoSumSorted(values.data(), n, target);
        std::cout << pair.size();
        for (int v : pair) std::cout << ' ' << v;
        std::cout << '\n';
    }
    return 0;
}
