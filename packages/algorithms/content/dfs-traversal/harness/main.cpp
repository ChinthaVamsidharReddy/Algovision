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
        int vertices;
        std::cin >> vertices;
        int start;
        std::cin >> start;
        std::vector<int> res(n + 16);
        int produced = dfs(values.data(), n, vertices, start, res.data());
        int len = produced;
        std::cout << len;
        for (int i = 0; i < len; i++) std::cout << ' ' << res[i];
        std::cout << '\n';
    }
    return 0;
}
