class Node {
    int value;
    Node left;
    Node right;
}


class Bst {
    static Node insert(Node root, int value) {           // @a entry
        Node created = new Node();                       // @a create-node
        created.value = value;                           // @a create-node
        if (root == null) { return created; }            // @a check-empty
        Node current = root;
        while (true) {
            if (value < current.value) {                 // @a compare
                if (current.left == null) {              // @a attach-left
                    current.left = created;              // @a attach-left
                    return root;                         // @a finish
                }
                current = current.left;                  // @a go-left
            } else {
                if (current.right == null) {             // @a attach-right
                    current.right = created;             // @a attach-right
                    return root;                         // @a finish
                }
                current = current.right;                 // @a go-right
            }
        }
    }
}
