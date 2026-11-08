#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;


Node *insert_at(Node *head, int position, int value) {   // @a entry
    Node *node = malloc(sizeof(Node));                   // @a create-node
    node->value = value;                                 // @a create-node
    node->next = NULL;                                   // @a create-node
    if (position == 0) {                                 // @a check-head
        node->next = head;                               // @a link-new-head
        return node;                                     // @a link-new-head
    }
    Node *prev = head;                                   // @a init-prev
    for (int i = 0; i < position - 1; i++) {             // @a walk-loop
        prev = prev->next;                               // @a advance
    }
    node->next = prev->next;                             // @a link-new
    prev->next = node;                                   // @a link-prev
    return head;                                         // @a finish
}
