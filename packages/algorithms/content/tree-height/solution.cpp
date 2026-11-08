struct Node {
    int value;
    Node* left;
    Node* right;
};


int height(const Node* node) {                           // @a entry
    if (node == nullptr) { return 0; }                   // @a base-case
    int left = height(node->left);                       // @a go-left
    int right = height(node->right);                     // @a go-right
    return 1 + (left > right ? left : right);            // @a combine
}
