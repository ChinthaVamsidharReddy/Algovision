#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;


int find_middle(Node *head) {                            // @a entry
    Node *slow = head;                                   // @a init-pointers
    Node *fast = head;                                   // @a init-pointers
    while (fast != NULL && fast->next != NULL) {         // @a loop
        slow = slow->next;                               // @a move-slow
        fast = fast->next->next;                         // @a move-fast
    }
    return slow->value;                                  // @a finish
}
