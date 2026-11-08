#include <iostream>
#include <vector>
#include "solution.cpp"

static Node* insertNode(Node* root, int v) {
    if (root == nullptr) return new Node{v, nullptr, nullptr};
    if (v < root->value) root->left = insertNode(root->left, v);
    else root->right = insertNode(root->right, v);
    return root;
}

static void inorderOf(const Node* node, std::vector<int>& out) {
    if (node == nullptr) return;
    inorderOf(node->left, out);
    out.push_back(node->value);
    inorderOf(node->right, out);
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
        int value;
        std::cin >> value;
        std::vector<int> visited;
        root = insert(root, value);
        inorderOf(root, visited);
        std::cout << visited.size();
        for (int v : visited) std::cout << ' ' << v;
        std::cout << '\n';
        release(root);
    }
    return 0;
}
