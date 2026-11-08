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
        int vertices;
        std::cin >> vertices;
        std::cout << hasCycle(values.data(), n, vertices) << '\n';
    }
    return 0;
}
