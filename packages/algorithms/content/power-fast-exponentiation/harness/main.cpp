#include <iostream>
#include "solution.cpp"

int main() {
    int cases;
    std::cin >> cases;
    while (cases--) {
        int base;
        std::cin >> base;
        int exp;
        std::cin >> exp;
        std::cout << power(base, exp) << '\n';
    }
    return 0;
}
