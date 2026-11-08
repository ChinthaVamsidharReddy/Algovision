#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;


int search(Node *head, int value) {                      // @a entry
    int index = 0;                                       // @a init-index
    Node *current = head;                                // @a init-current
    while (current != NULL) {                            // @a loop
        if (current->value == value) {                   // @a compare
            return index;                                // @a found
        }
        current = current->next;                         // @a advance
        index++;                                         // @a advance
    }
    return -1;                                           // @a not-found
}
