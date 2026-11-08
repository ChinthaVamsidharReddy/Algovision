struct Node {
    int value;
    Node* left;
    Node* right;
};


int countLeaves(const Node* node) {                      // @a entry
    if (node == nullptr) { return 0; }                   // @a base-case
    if (node->left == nullptr && node->right == nullptr) { return 1; }   // @a check-leaf
    int left = countLeaves(node->left);                  // @a go-left
    int right = countLeaves(node->right);                // @a go-right
    return left + right;                                 // @a combine
}
