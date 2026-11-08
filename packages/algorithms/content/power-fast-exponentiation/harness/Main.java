import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int cases = in.nextInt();
        StringBuilder out = new StringBuilder();
        for (int c = 0; c < cases; c++) {
            int base = in.nextInt();
            int exp = in.nextInt();
            out.append(Power.power(base, exp)).append('\n');
        }
        System.out.print(out);
    }
}
