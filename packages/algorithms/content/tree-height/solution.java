class Node {
    int value;
    Node left;
    Node right;
}


class Height {
    static int height(Node node) {                       // @a entry
        if (node == null) { return 0; }                  // @a base-case
        int left = height(node.left);                    // @a go-left
        int right = height(node.right);                  // @a go-right
        return 1 + Math.max(left, right);                // @a combine
    }
}
