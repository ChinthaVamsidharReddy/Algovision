class Node {
    int value;
    Node left;
    Node right;
}


class Leaves {
    static int countLeaves(Node node) {                  // @a entry
        if (node == null) { return 0; }                  // @a base-case
        if (node.left == null && node.right == null) { return 1; }   // @a check-leaf
        int left = countLeaves(node.left);               // @a go-left
        int right = countLeaves(node.right);             // @a go-right
        return left + right;                             // @a combine
    }
}
