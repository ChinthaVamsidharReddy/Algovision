#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;


Node *remove_nth_from_end(Node *head, int n) {           // @a entry
    Node *fast = head;                                   // @a init-pointers
    Node *slow = head;                                   // @a init-pointers
    for (int i = 0; i < n; i++) {                        // @a gap-loop
        fast = fast->next;                               // @a gap-advance
    }
    if (fast == NULL) {                                  // @a check-head
        return head->next;                               // @a remove-head
    }
    while (fast->next != NULL) {                         // @a loop
        fast = fast->next;                               // @a move-fast
        slow = slow->next;                               // @a move-slow
    }
    slow->next = slow->next->next;                       // @a unlink
    return head;                                         // @a finish
}
