import java.util.List;

class Node {
    int value;
    Node left;
    Node right;
}


class MinMax {
    static void findMinMax(Node root, List<Integer> out) {   // @a entry
        Node current = root;                             // @a init-min
        while (current.left != null) {                   // @a loop-min
            current = current.left;                      // @a go-left
        }
        out.add(current.value);                          // @a record-min
        current = root;                                  // @a init-max
        while (current.right != null) {                  // @a loop-max
            current = current.right;                     // @a go-right
        }
        out.add(current.value);                          // @a record-max
        return;                                          // @a finish
    }
}
