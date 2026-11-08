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
        int amount;
        std::cin >> amount;
        std::cout << coinChange(values.data(), n, amount) << '\n';
    }
    return 0;
}
