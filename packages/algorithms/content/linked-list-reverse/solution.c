#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;


Node *reverse(Node *head) {                              // @a entry
    Node *prev = NULL;                                   // @a init-prev
    Node *current = head;                                // @a init-current
    while (current != NULL) {                            // @a loop
        Node *next = current->next;                      // @a save-next
        current->next = prev;                            // @a reverse-link
        prev = current;                                  // @a move-prev
        current = next;                                  // @a move-current
    }
    return prev;                                         // @a finish
}
