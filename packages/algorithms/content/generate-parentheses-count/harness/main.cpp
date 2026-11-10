#include <iostream>
#include "solution.cpp"

int main() {
    int cases;
    std::cin >> cases;
    while (cases--) {
        int n;
        std::cin >> n;
        std::cout << countParentheses(n) << '\n';
    }
    return 0;
}
