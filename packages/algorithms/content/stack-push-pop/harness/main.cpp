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
        int pops;
        std::cin >> pops;
        std::vector<int> stack(n + 1);
        int size = stackRun(values.data(), n, pops, stack.data());
        std::cout << size;
        for (int i = 0; i < size; i++) std::cout << ' ' << stack[i];
        std::cout << '\n';
    }
    return 0;
}
