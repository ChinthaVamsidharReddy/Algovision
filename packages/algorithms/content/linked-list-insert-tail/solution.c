#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;

Node *insert_at_tail(Node *head, int value) {   // @a entry
    Node *node = malloc(sizeof(Node));          // @a create-node
    node->value = value;                        // @a create-node
    node->next = NULL;                          // @a create-node
    if (head == NULL) {                         // @a check-empty
        head = node;                            // @a set-head
    } else {
        Node *current = head;                   // @a init-current
        while (current->next != NULL) {         // @a loop
            current = current->next;            // @a advance
        }
        current->next = node;                   // @a link-tail
    }
    return head;                                // @a finish
}
