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
        int index;
        std::cin >> index;
        std::cout << fenwickPrefixSum(values.data(), n, index) << '\n';
    }
    return 0;
}
