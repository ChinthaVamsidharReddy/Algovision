#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;

Node *insert_at_head(Node *head, int value) {  // @a entry
    Node *node = malloc(sizeof(Node));          // @a create-node
    node->value = value;                        // @a create-node
    node->next = head;                          // @a link-next
    head = node;                                // @a move-head
    return head;                                // @a finish
}
