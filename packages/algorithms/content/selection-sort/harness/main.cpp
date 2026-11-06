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
        selectionSort(values.data(), n);
        std::cout << n;
        for (int v : values) std::cout << ' ' << v;
        std::cout << '\n';
    }
    return 0;
}
