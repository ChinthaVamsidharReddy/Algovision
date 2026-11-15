class AvlTree {
    static class Node {
        int value;
        int height = 1;
        Node left;
        Node right;
        Node(int value) { this.value = value; }
    }

    static int height(Node node) { return node == null ? 0 : node.height; }

    static void update(Node node) { node.height = 1 + Math.max(height(node.left), height(node.right)); }

    static Node rotateRight(Node y) {                    // @a rotate-right
        Node x = y.left;                                 // @a rotate-right
        y.left = x.right;                                // @a rotate-right
        x.right = y;                                     // @a rotate-right
        update(y);                                       // @a rotate-right
        update(x);                                       // @a rotate-right
        return x;                                        // @a rotate-right
    }

    static Node rotateLeft(Node x) {                     // @a rotate-left
        Node y = x.right;                                // @a rotate-left
        x.right = y.left;                                // @a rotate-left
        y.left = x;                                      // @a rotate-left
        update(x);                                       // @a rotate-left
        update(y);                                       // @a rotate-left
        return y;                                        // @a rotate-left
    }

    static Node insert(Node node, int value) {           // @a insert
        if (node == null) {
            return new Node(value);                      // @a create
        }
        if (value == node.value) { return node; }        // @a duplicate
        if (value < node.value) {                        // @a compare
            node.left = insert(node.left, value);        // @a go-left
        } else {
            node.right = insert(node.right, value);      // @a go-right
        }
        update(node);                                    // @a balance
        int balance = height(node.left) - height(node.right);   // @a balance
        if (balance > 1 && value < node.left.value) { return rotateRight(node); }    // @a rotate-right
        if (balance < -1 && value > node.right.value) { return rotateLeft(node); }   // @a rotate-left
        if (balance > 1) {                               // @a rotate-left
            node.left = rotateLeft(node.left);           // @a rotate-left
            return rotateRight(node);                    // @a rotate-right
        }
        if (balance < -1) {                              // @a rotate-right
            node.right = rotateRight(node.right);        // @a rotate-right
            return rotateLeft(node);                     // @a rotate-left
        }
        return node;                                     // @a balanced
    }

    static int avlTreeHeight(int[] values) {             // @a entry
        Node root = null;
        for (int v : values) {
            root = insert(root, v);                      // @a next
        }
        return height(root);                             // @a finish
    }
}
