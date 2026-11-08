#include <iostream>
#include <vector>
#include "solution.cpp"

static Node* insertNode(Node* root, int v) {
    if (root == nullptr) return new Node{v, nullptr, nullptr};
    if (v < root->value) root->left = insertNode(root->left, v);
    else root->right = insertNode(root->right, v);
    return root;
}

static void release(Node* root) {
    if (root == nullptr) return;
    release(root->left);
    release(root->right);
    delete root;
}

int main() {
    int cases;
    std::cin >> cases;
    while (cases--) {
        int n;
        std::cin >> n;
        Node* root = nullptr;
        for (int i = 0; i < n; i++) {
            int v;
            std::cin >> v;
            root = insertNode(root, v);
        }
        std::vector<int> visited;
        levelOrder(root, visited);
        std::cout << visited.size();
        for (int v : visited) std::cout << ' ' << v;
        std::cout << '\n';
        release(root);
    }
    return 0;
}
