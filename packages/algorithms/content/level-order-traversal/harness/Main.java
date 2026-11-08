import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class Main {
    static Node insert(Node root, int v) {
        if (root == null) {
            Node created = new Node();
            created.value = v;
            return created;
        }
        if (v < root.value) root.left = insert(root.left, v);
        else root.right = insert(root.right, v);
        return root;
    }

    static void inorder(Node node, List<Integer> out) {
        if (node == null) return;
        inorder(node.left, out);
        out.add(node.value);
        inorder(node.right, out);
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int cases = in.nextInt();
        StringBuilder out = new StringBuilder();
        for (int c = 0; c < cases; c++) {
            int n = in.nextInt();
            Node root = null;
            for (int i = 0; i < n; i++) root = insert(root, in.nextInt());
            List<Integer> visited = new ArrayList<>();
            LevelOrder.levelOrder(root, visited);
            out.append(visited.size());
            for (int v : visited) out.append(' ').append(v);
            out.append('\n');
        }
        System.out.print(out);
    }
}
