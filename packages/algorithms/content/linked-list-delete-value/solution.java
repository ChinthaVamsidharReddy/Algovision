class Node {
    int value;
    Node next;

    Node(int value) {
        this.value = value;
    }
}


class ListOps {
    static Node deleteValue(Node head, int value) {      // @a entry
        if (head == null) { return null; }               // @a check-empty
        if (head.value == value) {                       // @a check-head
            return head.next;                            // @a delete-head
        }
        Node prev = head;                                // @a init-prev
        while (prev.next != null && prev.next.value != value) {   // @a loop
            prev = prev.next;                            // @a advance
        }
        if (prev.next != null) {                         // @a check-found
            prev.next = prev.next.next;                  // @a unlink
        }
        return head;                                     // @a finish
    }
}
