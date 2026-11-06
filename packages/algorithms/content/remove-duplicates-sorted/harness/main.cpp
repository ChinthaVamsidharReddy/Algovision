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
        int k = removeDuplicates(values.data(), n);
        std::cout << k;
        for (int i = 0; i < k; i++) std::cout << ' ' << values[i];
        std::cout << '\n';
    }
    return 0;
}
