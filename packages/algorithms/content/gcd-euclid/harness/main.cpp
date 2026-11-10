#include <iostream>
#include "solution.cpp"

int main() {
    int cases;
    std::cin >> cases;
    while (cases--) {
        int a;
        std::cin >> a;
        int b;
        std::cin >> b;
        std::cout << gcdEuclid(a, b) << '\n';
    }
    return 0;
}
