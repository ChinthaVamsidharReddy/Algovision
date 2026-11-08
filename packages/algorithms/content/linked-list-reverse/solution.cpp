struct Node {
    int value;
    Node* next;

    explicit Node(int v) : value(v), next(nullptr) {}
};


Node* reverse(Node* head) {                              // @a entry
    Node* prev = nullptr;                                // @a init-prev
    Node* current = head;                                // @a init-current
    while (current != nullptr) {                         // @a loop
        Node* next = current->next;                      // @a save-next
        current->next = prev;                            // @a reverse-link
        prev = current;                                  // @a move-prev
        current = next;                                  // @a move-current
    }
    return prev;                                         // @a finish
}
