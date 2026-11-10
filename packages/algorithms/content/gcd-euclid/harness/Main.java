import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int cases = in.nextInt();
        StringBuilder out = new StringBuilder();
        for (int c = 0; c < cases; c++) {
            int a = in.nextInt();
            int b = in.nextInt();
            out.append(Gcd.gcd(a, b)).append('\n');
        }
        System.out.print(out);
    }
}
