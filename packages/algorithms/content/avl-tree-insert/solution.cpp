#include <algorithm>

struct AvlNode {
    int value;
    int height;
    AvlNode* left;
    AvlNode* right;
};

static int heightOf(const AvlNode* node) { return node == nullptr ? 0 : node->height; }

static void update(AvlNode* node) { node->height = 1 + std::max(heightOf(node->left), heightOf(node->right)); }

static AvlNode* rotateRight(AvlNode* y) {                // @a rotate-right
    AvlNode* x = y->left;                                // @a rotate-right
    y->left = x->right;                                  // @a rotate-right
    x->right = y;                                        // @a rotate-right
    update(y);                                           // @a rotate-right
    update(x);                                           // @a rotate-right
    return x;                                            // @a rotate-right
}

static AvlNode* rotateLeft(AvlNode* x) {                 // @a rotate-left
    AvlNode* y = x->right;                               // @a rotate-left
    x->right = y->left;                                  // @a rotate-left
    y->left = x;                                         // @a rotate-left
    update(x);                                           // @a rotate-left
    update(y);                                           // @a rotate-left
    return y;                                            // @a rotate-left
}

static AvlNode* insertNode(AvlNode* node, int value) {   // @a insert
    if (node == nullptr) {
        return new AvlNode{value, 1, nullptr, nullptr};  // @a create
    }
    if (value == node->value) { return node; }           // @a duplicate
    if (value < node->value) {                           // @a compare
        node->left = insertNode(node->left, value);      // @a go-left
    } else {
        node->right = insertNode(node->right, value);    // @a go-right
    }
    update(node);                                        // @a balance
    int balance = heightOf(node->left) - heightOf(node->right);   // @a balance
    if (balance > 1 && value < node->left->value) { return rotateRight(node); }    // @a rotate-right
    if (balance < -1 && value > node->right->value) { return rotateLeft(node); }   // @a rotate-left
    if (balance > 1) {                                   // @a rotate-left
        node->left = rotateLeft(node->left);             // @a rotate-left
        return rotateRight(node);                        // @a rotate-right
    }
    if (balance < -1) {                                  // @a rotate-right
        node->right = rotateRight(node->right);          // @a rotate-right
        return rotateLeft(node);                         // @a rotate-left
    }
    return node;                                         // @a balanced
}

static void release(AvlNode* node) {
    if (node == nullptr) return;
    release(node->left);
    release(node->right);
    delete node;
}

int avlTreeHeight(const int values[], int n) {           // @a entry
    AvlNode* root = nullptr;
    for (int i = 0; i < n; i++) {
        root = insertNode(root, values[i]);              // @a next
    }
    int h = heightOf(root);                              // @a finish
    release(root);
    return h;
}
