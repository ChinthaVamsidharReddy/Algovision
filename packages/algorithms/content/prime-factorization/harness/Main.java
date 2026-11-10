import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int cases = in.nextInt();
        StringBuilder out = new StringBuilder();
        for (int c = 0; c < cases; c++) {
            int n = in.nextInt();
            int[] res = Factors.factorize(n);
            out.append(res.length);
            for (int x : res) out.append(' ').append(x);
            out.append('\n');
        }
        System.out.print(out);
    }
}
