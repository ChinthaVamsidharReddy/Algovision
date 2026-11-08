import java.util.ArrayDeque;
import java.util.List;
import java.util.Queue;

class Node {
    int value;
    Node left;
    Node right;
}


class LevelOrder {
    static void levelOrder(Node root, List<Integer> out) {   // @a entry
        if (root == null) { return; }
        Queue<Node> queue = new ArrayDeque<>();
        queue.add(root);                                 // @a enqueue-root
        while (!queue.isEmpty()) {                       // @a loop
            Node node = queue.remove();                  // @a dequeue
            out.add(node.value);                         // @a visit
            if (node.left != null) { queue.add(node.left); }     // @a enqueue-left
            if (node.right != null) { queue.add(node.right); }   // @a enqueue-right
        }
        return;                                          // @a finish
    }
}
