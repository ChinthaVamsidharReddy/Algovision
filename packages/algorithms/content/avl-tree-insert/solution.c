#include <stdlib.h>

typedef struct AvlNode {
    int value;
    int height;
    struct AvlNode *left;
    struct AvlNode *right;
} AvlNode;

static int height_of(const AvlNode *node) { return node == NULL ? 0 : node->height; }

static int larger(int a, int b) { return a > b ? a : b; }

static void update(AvlNode *node) { node->height = 1 + larger(height_of(node->left), height_of(node->right)); }

static AvlNode *rotate_right(AvlNode *y) {               // @a rotate-right
    AvlNode *x = y->left;                                // @a rotate-right
    y->left = x->right;                                  // @a rotate-right
    x->right = y;                                        // @a rotate-right
    update(y);                                           // @a rotate-right
    update(x);                                           // @a rotate-right
    return x;                                            // @a rotate-right
}

static AvlNode *rotate_left(AvlNode *x) {                // @a rotate-left
    AvlNode *y = x->right;                               // @a rotate-left
    x->right = y->left;                                  // @a rotate-left
    y->left = x;                                         // @a rotate-left
    update(x);                                           // @a rotate-left
    update(y);                                           // @a rotate-left
    return y;                                            // @a rotate-left
}

static AvlNode *insert_node(AvlNode *node, int value) {  // @a insert
    if (node == NULL) {
        AvlNode *fresh = malloc(sizeof(AvlNode));        // @a create
        fresh->value = value;                            // @a create
        fresh->height = 1;                               // @a create
        fresh->left = NULL;                              // @a create
        fresh->right = NULL;                             // @a create
        return fresh;                                    // @a create
    }
    if (value == node->value) { return node; }           // @a duplicate
    if (value < node->value) {                           // @a compare
        node->left = insert_node(node->left, value);     // @a go-left
    } else {
        node->right = insert_node(node->right, value);  // @a go-right
    }
    update(node);                                        // @a balance
    int balance = height_of(node->left) - height_of(node->right);   // @a balance
    if (balance > 1 && value < node->left->value) { return rotate_right(node); }    // @a rotate-right
    if (balance < -1 && value > node->right->value) { return rotate_left(node); }   // @a rotate-left
    if (balance > 1) {                                   // @a rotate-left
        node->left = rotate_left(node->left);            // @a rotate-left
        return rotate_right(node);                       // @a rotate-right
    }
    if (balance < -1) {                                  // @a rotate-right
        node->right = rotate_right(node->right);         // @a rotate-right
        return rotate_left(node);                        // @a rotate-left
    }
    return node;                                         // @a balanced
}

static void release(AvlNode *node) {
    if (node == NULL) return;
    release(node->left);
    release(node->right);
    free(node);
}

int avl_tree_height(const int values[], int n) {         // @a entry
    AvlNode *root = NULL;
    for (int i = 0; i < n; i++) {
        root = insert_node(root, values[i]);             // @a next
    }
    int h = height_of(root);                             // @a finish
    release(root);
    return h;
}
