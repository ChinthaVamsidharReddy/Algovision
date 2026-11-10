#include <iostream>
#include <vector>
#include "solution.cpp"

int main() {
    int cases;
    std::cin >> cases;
    while (cases--) {
        int n;
        std::cin >> n;
        std::vector<int> res(16);
        int count = factorize(n, res.data());
        std::cout << count;
        for (int i = 0; i < count; i++) std::cout << ' ' << res[i];
        std::cout << '\n';
    }
    return 0;
}
