#include <stddef.h>
#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node* left;
    struct Node* right;
} Node;


Node* insert(Node* root, int value) {                    // @a entry
    Node* created = malloc(sizeof(Node));                // @a create-node
    created->value = value;                              // @a create-node
    created->left = NULL;                                // @a create-node
    created->right = NULL;                               // @a create-node
    if (root == NULL) { return created; }                // @a check-empty
    Node* current = root;
    while (1) {
        if (value < current->value) {                    // @a compare
            if (current->left == NULL) {                 // @a attach-left
                current->left = created;                 // @a attach-left
                return root;                             // @a finish
            }
            current = current->left;                     // @a go-left
        } else {
            if (current->right == NULL) {                // @a attach-right
                current->right = created;                // @a attach-right
                return root;                             // @a finish
            }
            current = current->right;                    // @a go-right
        }
    }
}
