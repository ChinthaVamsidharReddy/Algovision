#include <iostream>
#include <string>
#include "solution.cpp"

int main() {
    int cases;
    std::cin >> cases;
    while (cases--) {
        int ns;
        std::cin >> ns;
        std::string s;
        for (int i = 0; i < ns; i++) {
            int v;
            std::cin >> v;
            s += static_cast<char>(v);
        }
        int nt;
        std::cin >> nt;
        std::string t;
        for (int i = 0; i < nt; i++) {
            int v;
            std::cin >> v;
            t += static_cast<char>(v);
        }
        std::cout << editDistance(s, t) << '\n';
    }
    return 0;
}
