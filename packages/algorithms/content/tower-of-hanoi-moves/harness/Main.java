import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int cases = in.nextInt();
        StringBuilder out = new StringBuilder();
        for (int c = 0; c < cases; c++) {
            int n = in.nextInt();
            out.append(Hanoi.hanoi(n)).append('\n');
        }
        System.out.print(out);
    }
}
