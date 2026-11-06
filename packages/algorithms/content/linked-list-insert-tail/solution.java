class Node {
    int value;
    Node next;

    Node(int value) {
        this.value = value;
    }
}

class LinkedList {
    Node head;

    void insertAtTail(int value) {            // @a entry
        Node node = new Node(value);          // @a create-node
        if (head == null) {                   // @a check-empty
            head = node;                      // @a set-head
        } else {
            Node current = head;              // @a init-current
            while (current.next != null) {    // @a loop
                current = current.next;       // @a advance
            }
            current.next = node;              // @a link-tail
        }
        return;                               // @a finish
    }
}
