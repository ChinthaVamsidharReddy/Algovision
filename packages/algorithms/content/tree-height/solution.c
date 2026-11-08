#include <stddef.h>
#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node* left;
    struct Node* right;
} Node;


int height(const Node* node) {                           // @a entry
    if (node == NULL) { return 0; }                      // @a base-case
    int left = height(node->left);                       // @a go-left
    int right = height(node->right);                     // @a go-right
    return 1 + (left > right ? left : right);            // @a combine
}
