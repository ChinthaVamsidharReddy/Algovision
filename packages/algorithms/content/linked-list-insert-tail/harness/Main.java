import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int cases = in.nextInt();
        StringBuilder out = new StringBuilder();
        for (int c = 0; c < cases; c++) {
            int n = in.nextInt();
            LinkedList list = new LinkedList();
            Node tail = null;
            for (int i = 0; i < n; i++) {
                Node node = new Node(in.nextInt());
                if (tail == null) list.head = node; else tail.next = node;
                tail = node;
            }
            list.insertAtTail(in.nextInt());
            int count = 0;
            for (Node p = list.head; p != null; p = p.next) count++;
            out.append(count);
            for (Node p = list.head; p != null; p = p.next) out.append(' ').append(p.value);
            out.append('\n');
        }
        System.out.print(out);
    }
}
