#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;


Node *delete_value(Node *head, int value) {              // @a entry
    if (head == NULL) { return NULL; }                   // @a check-empty
    if (head->value == value) {                          // @a check-head
        return head->next;                               // @a delete-head
    }
    Node *prev = head;                                   // @a init-prev
    while (prev->next != NULL && prev->next->value != value) {   // @a loop
        prev = prev->next;                               // @a advance
    }
    if (prev->next != NULL) {                            // @a check-found
        prev->next = prev->next->next;                   // @a unlink
    }
    return head;                                         // @a finish
}
