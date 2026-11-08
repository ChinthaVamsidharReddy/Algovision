import java.util.List;

class Node {
    int value;
    Node left;
    Node right;
}

class PostOrder {
    static void visit(Node node, List<Integer> out) {    // @a entry
        if (node == null) {                              // @a base-case
            return;                                      // @a base-case
        }
        visit(node.left, out);                       // @a go-left
        visit(node.right, out);                      // @a go-right
        out.add(node.value);                         // @a visit
        return;                                          // @a finish
    }
}
