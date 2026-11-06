#include <iostream>
#include <vector>
#include "solution.cpp"

int main() {
    int cases;
    std::cin >> cases;
    while (cases--) {
        int n;
        std::cin >> n;
        std::vector<int> values(n + 1);
        for (int i = 0; i < n; i++) std::cin >> values[i];
        int index;
        std::cin >> index;
        int value;
        std::cin >> value;
        insertAt(values.data(), n, index, value);
        std::cout << n + 1;
        for (int i = 0; i < n + 1; i++) std::cout << ' ' << values[i];
        std::cout << '\n';
    }
    return 0;
}
