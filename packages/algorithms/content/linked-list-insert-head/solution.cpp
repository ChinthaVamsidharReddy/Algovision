struct Node {
    int value;
    Node* next;

    explicit Node(int v) : value(v), next(nullptr) {}
};

class LinkedList {
public:
    Node* head = nullptr;

    void insertAtHead(int value) {    // @a entry
        Node* node = new Node(value); // @a create-node
        node->next = head;            // @a link-next
        head = node;                  // @a move-head
        return;                       // @a finish
    }
};
