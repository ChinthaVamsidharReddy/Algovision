class Node {
    int value;
    Node left;
    Node right;
}


class Bst {
    static int search(Node root, int value) {            // @a entry
        Node current = root;                             // @a init
        while (current != null) {                        // @a loop
            if (value == current.value) { return 1; }    // @a found
            if (value < current.value) {
                current = current.left;                  // @a go-left
            } else {
                current = current.right;                 // @a go-right
            }
        }
        return 0;                                        // @a not-found
    }
}
