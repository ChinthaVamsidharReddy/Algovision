class Node {
    int value;
    Node next;

    Node(int value) {
        this.value = value;
    }
}


class ListOps {
    static Node reverse(Node head) {                     // @a entry
        Node prev = null;                                // @a init-prev
        Node current = head;                             // @a init-current
        while (current != null) {                        // @a loop
            Node next = current.next;                    // @a save-next
            current.next = prev;                         // @a reverse-link
            prev = current;                              // @a move-prev
            current = next;                              // @a move-current
        }
        return prev;                                     // @a finish
    }
}
