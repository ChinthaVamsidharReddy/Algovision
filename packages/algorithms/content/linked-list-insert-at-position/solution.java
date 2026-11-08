class Node {
    int value;
    Node next;

    Node(int value) {
        this.value = value;
    }
}


class ListOps {
    static Node insertAt(Node head, int position, int value) {   // @a entry
        Node node = new Node(value);                     // @a create-node
        if (position == 0) {                             // @a check-head
            node.next = head;                            // @a link-new-head
            return node;                                 // @a link-new-head
        }
        Node prev = head;                                // @a init-prev
        for (int i = 0; i < position - 1; i++) {         // @a walk-loop
            prev = prev.next;                            // @a advance
        }
        node.next = prev.next;                           // @a link-new
        prev.next = node;                                // @a link-prev
        return head;                                     // @a finish
    }
}
