import java.util.List;

class Node {
    int value;
    Node left;
    Node right;
}

class InOrder {
    static void visit(Node node, List<Integer> out) {    // @a entry
        if (node == null) {                              // @a base-case
            return;                                      // @a base-case
        }
        visit(node.left, out);                           // @a go-left
        out.add(node.value);                             // @a visit
        visit(node.right, out);                          // @a go-right
        return;                                          // @a finish
    }
}
