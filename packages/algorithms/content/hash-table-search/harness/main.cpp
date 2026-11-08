#include <iostream>
#include <vector>
#include "solution.cpp"

int main() {
    int cases;
    std::cin >> cases;
    while (cases--) {
        int n;
        std::cin >> n;
        std::vector<int> keys(n);
        for (int i = 0; i < n; i++) std::cin >> keys[i];
        int size, key;
        std::cin >> size >> key;
        std::vector<int> table(size, -1);
        for (int k = 0; k < n; k++) {
            int index = keys[k] % size;
            int tries = 0;
            while (table[index] != -1 && tries < size) {
                index = (index + 1) % size;
                tries++;
            }
            if (tries < size) table[index] = keys[k];
        }
        std::cout << search(table.data(), size, key) << '\n';
    }
    return 0;
}
