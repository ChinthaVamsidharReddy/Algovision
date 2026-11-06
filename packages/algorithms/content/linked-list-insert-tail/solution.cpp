struct Node {
    int value;
    Node* next;

    explicit Node(int v) : value(v), next(nullptr) {}
};

class LinkedList {
public:
    Node* head = nullptr;

    void insertAtTail(int value) {            // @a entry
        Node* node = new Node(value);         // @a create-node
        if (head == nullptr) {                // @a check-empty
            head = node;                      // @a set-head
        } else {
            Node* current = head;             // @a init-current
            while (current->next != nullptr) {  // @a loop
                current = current->next;      // @a advance
            }
            current->next = node;             // @a link-tail
        }
        return;                               // @a finish
    }
};
