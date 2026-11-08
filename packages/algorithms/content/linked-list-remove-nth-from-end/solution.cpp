struct Node {
    int value;
    Node* next;

    explicit Node(int v) : value(v), next(nullptr) {}
};


Node* removeNthFromEnd(Node* head, int n) {              // @a entry
    Node* fast = head;                                   // @a init-pointers
    Node* slow = head;                                   // @a init-pointers
    for (int i = 0; i < n; i++) {                        // @a gap-loop
        fast = fast->next;                               // @a gap-advance
    }
    if (fast == nullptr) {                               // @a check-head
        return head->next;                               // @a remove-head
    }
    while (fast->next != nullptr) {                      // @a loop
        fast = fast->next;                               // @a move-fast
        slow = slow->next;                               // @a move-slow
    }
    slow->next = slow->next->next;                       // @a unlink
    return head;                                         // @a finish
}
