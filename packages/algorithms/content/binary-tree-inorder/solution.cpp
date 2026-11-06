#include <vector>

struct Node {
    int value;
    Node* left;
    Node* right;
};

void visit(const Node* node, std::vector<int>& out) {   // @a entry
    if (node == nullptr) {                               // @a base-case
        return;                                          // @a base-case
    }
    visit(node->left, out);                              // @a go-left
    out.push_back(node->value);                          // @a visit
    visit(node->right, out);                             // @a go-right
    return;                                              // @a finish
}
