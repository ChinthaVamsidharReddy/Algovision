#include <stddef.h>
#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node* left;
    struct Node* right;
} Node;


int count_leaves(const Node* node) {                     // @a entry
    if (node == NULL) { return 0; }                      // @a base-case
    if (node->left == NULL && node->right == NULL) { return 1; }   // @a check-leaf
    int left = count_leaves(node->left);                 // @a go-left
    int right = count_leaves(node->right);               // @a go-right
    return left + right;                                 // @a combine
}
