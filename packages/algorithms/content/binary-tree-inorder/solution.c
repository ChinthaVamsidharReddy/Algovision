#include <stddef.h>

typedef struct Node {
    int value;
    struct Node* left;
    struct Node* right;
} Node;

void visit(const Node* node, int out[], int* count) {    // @a entry
    if (node == NULL) {                                  // @a base-case
        return;                                          // @a base-case
    }
    visit(node->left, out, count);                       // @a go-left
    out[*count] = node->value;                           // @a visit
    (*count)++;                                          // @a visit
    visit(node->right, out, count);                      // @a go-right
    return;                                              // @a finish
}
