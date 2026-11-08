import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int cases = in.nextInt();
        StringBuilder out = new StringBuilder();
        for (int c = 0; c < cases; c++) {
            int len = in.nextInt();
            Node head = null, tail = null;
            for (int i = 0; i < len; i++) {
                Node node = new Node(in.nextInt());
                if (tail == null) head = node; else tail.next = node;
                tail = node;
            }
            head = ListOps.reverse(head);
            int count = 0;
            for (Node p = head; p != null; p = p.next) count++;
            out.append(count);
            for (Node p = head; p != null; p = p.next) out.append(' ').append(p.value);
            out.append('\n');
        }
        System.out.print(out);
    }
}
