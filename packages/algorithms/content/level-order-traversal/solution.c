#include <stddef.h>
#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node* left;
    struct Node* right;
} Node;


void level_order(const Node* root, int n, int out[], int* count) {   // @a entry
    if (root == NULL) { return; }
    const Node** queue = malloc(sizeof(Node*) * (size_t)n);
    int head = 0;
    int tail = 0;
    queue[tail++] = root;                                // @a enqueue-root
    while (head < tail) {                                // @a loop
        const Node* node = queue[head++];                // @a dequeue
        out[(*count)++] = node->value;                   // @a visit
        if (node->left != NULL) { queue[tail++] = node->left; }     // @a enqueue-left
        if (node->right != NULL) { queue[tail++] = node->right; }   // @a enqueue-right
    }
    free(queue);
    return;                                              // @a finish
}
