#include <stddef.h>
#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node* left;
    struct Node* right;
} Node;

void visit(const Node* node, int out[], int* count) {    // @a entry
    if (node == NULL) {                                  // @a base-case
        return;                                          // @a base-case
    }
    visit(node->left, out, count);                    // @a go-left
    visit(node->right, out, count);                   // @a go-right
    out[(*count)++] = node->value;                    // @a visit
    return;                                              // @a finish
}
