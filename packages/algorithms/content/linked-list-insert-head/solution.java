class Node {
    int value;
    Node next;

    Node(int value) {
        this.value = value;
    }
}

class LinkedList {
    Node head;

    void insertAtHead(int value) {    // @a entry
        Node node = new Node(value);  // @a create-node
        node.next = head;             // @a link-next
        head = node;                  // @a move-head
        return;                       // @a finish
    }
}
