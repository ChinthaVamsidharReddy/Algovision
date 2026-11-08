class Node {
    int value;
    Node next;

    Node(int value) {
        this.value = value;
    }
}


class ListOps {
    static int findMiddle(Node head) {                   // @a entry
        Node slow = head;                                // @a init-pointers
        Node fast = head;                                // @a init-pointers
        while (fast != null && fast.next != null) {      // @a loop
            slow = slow.next;                            // @a move-slow
            fast = fast.next.next;                       // @a move-fast
        }
        return slow.value;                               // @a finish
    }
}
