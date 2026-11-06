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
        std::vector<int> queue(n + 1);
        int size = queueRun(values.data(), n, pops, queue.data());
        std::cout << size;
        for (int i = 0; i < size; i++) std::cout << ' ' << queue[i];
        std::cout << '\n';
    }
    return 0;
}
