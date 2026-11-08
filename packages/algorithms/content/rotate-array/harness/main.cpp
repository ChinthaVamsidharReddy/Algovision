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
        int k;
        std::cin >> k;
        rotate(values.data(), n, k);
        std::cout << n;
        for (int i = 0; i < n; i++) std::cout << ' ' << values[i];
        std::cout << '\n';
    }
    return 0;
}
