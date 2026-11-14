#include <iostream>
#include <string>
#include "solution.cpp"

int main() {
    int cases;
    std::cin >> cases;
    while (cases--) {
        int n;
        std::cin >> n;
        std::string s;
        for (int i = 0; i < n; i++) {
            int v;
            std::cin >> v;
            s += static_cast<char>(v);
        }
        std::cout << longestNoRepeat(s) << '\n';
    }
    return 0;
}
