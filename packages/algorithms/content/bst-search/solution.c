#include <stddef.h>
#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node* left;
    struct Node* right;
} Node;


int search(const Node* root, int value) {                // @a entry
    const Node* current = root;                          // @a init
    while (current != NULL) {                            // @a loop
        if (value == current->value) { return 1; }       // @a found
        if (value < current->value) {
            current = current->left;                     // @a go-left
        } else {
            current = current->right;                    // @a go-right
        }
    }
    return 0;                                            // @a not-found
}
