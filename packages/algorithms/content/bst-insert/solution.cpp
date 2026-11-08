struct Node {
    int value;
    Node* left;
    Node* right;
};


Node* insert(Node* root, int value) {                    // @a entry
    Node* created = new Node{value, nullptr, nullptr};   // @a create-node
    if (root == nullptr) { return created; }             // @a check-empty
    Node* current = root;
    while (true) {
        if (value < current->value) {                    // @a compare
            if (current->left == nullptr) {              // @a attach-left
                current->left = created;                 // @a attach-left
                return root;                             // @a finish
            }
            current = current->left;                     // @a go-left
        } else {
            if (current->right == nullptr) {             // @a attach-right
                current->right = created;                // @a attach-right
                return root;                             // @a finish
            }
            current = current->right;                    // @a go-right
        }
    }
}
