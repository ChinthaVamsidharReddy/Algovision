#include <stddef.h>
#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node* left;
    struct Node* right;
} Node;


void find_min_max(const Node* root, int out[], int* count) {   // @a entry
    const Node* current = root;                          // @a init-min
    while (current->left != NULL) {                      // @a loop-min
        current = current->left;                         // @a go-left
    }
    out[(*count)++] = current->value;                    // @a record-min
    current = root;                                      // @a init-max
    while (current->right != NULL) {                     // @a loop-max
        current = current->right;                        // @a go-right
    }
    out[(*count)++] = current->value;                    // @a record-max
    return;                                              // @a finish
}
