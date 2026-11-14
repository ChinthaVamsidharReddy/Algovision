import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int cases = in.nextInt();
        StringBuilder out = new StringBuilder();
        for (int c = 0; c < cases; c++) {
            int ns = in.nextInt();
            StringBuilder bs = new StringBuilder();
            for (int i = 0; i < ns; i++) bs.append((char) in.nextInt());
            String s = bs.toString();
            int nt = in.nextInt();
            StringBuilder bt = new StringBuilder();
            for (int i = 0; i < nt; i++) bt.append((char) in.nextInt());
            String t = bt.toString();
            out.append(Edit.distance(s, t)).append('\n');
        }
        System.out.print(out);
    }
}
