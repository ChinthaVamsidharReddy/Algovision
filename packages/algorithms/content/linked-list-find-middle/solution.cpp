struct Node {
    int value;
    Node* next;

    explicit Node(int v) : value(v), next(nullptr) {}
};


int findMiddle(Node* head) {                             // @a entry
    Node* slow = head;                                   // @a init-pointers
    Node* fast = head;                                   // @a init-pointers
    while (fast != nullptr && fast->next != nullptr) {   // @a loop
        slow = slow->next;                               // @a move-slow
        fast = fast->next->next;                         // @a move-fast
    }
    return slow->value;                                  // @a finish
}
