import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int cases = in.nextInt();
        StringBuilder out = new StringBuilder();
        for (int c = 0; c < cases; c++) {
            int n = in.nextInt();
            StringBuilder text = new StringBuilder();
            for (int i = 0; i < n; i++) text.append((char) in.nextInt());
            String s = text.toString();
            out.append(Palindromes.longest(s)).append('\n');
        }
        System.out.print(out);
    }
}
