struct Node {
    int value;
    Node* next;

    explicit Node(int v) : value(v), next(nullptr) {}
};


int search(Node* head, int value) {                      // @a entry
    int index = 0;                                       // @a init-index
    Node* current = head;                                // @a init-current
    while (current != nullptr) {                         // @a loop
        if (current->value == value) {                   // @a compare
            return index;                                // @a found
        }
        current = current->next;                         // @a advance
        index++;                                         // @a advance
    }
    return -1;                                           // @a not-found
}
