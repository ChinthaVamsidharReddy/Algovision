struct Node {
    int value;
    Node* next;

    explicit Node(int v) : value(v), next(nullptr) {}
};


Node* deleteValue(Node* head, int value) {               // @a entry
    if (head == nullptr) { return nullptr; }             // @a check-empty
    if (head->value == value) {                          // @a check-head
        return head->next;                               // @a delete-head
    }
    Node* prev = head;                                   // @a init-prev
    while (prev->next != nullptr && prev->next->value != value) {   // @a loop
        prev = prev->next;                               // @a advance
    }
    if (prev->next != nullptr) {                         // @a check-found
        prev->next = prev->next->next;                   // @a unlink
    }
    return head;                                         // @a finish
}
