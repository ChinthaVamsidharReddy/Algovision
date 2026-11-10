import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int cases = in.nextInt();
        StringBuilder out = new StringBuilder();
        for (int c = 0; c < cases; c++) {
            int n = in.nextInt();
            int[] values = new int[n];
            for (int i = 0; i < n; i++) values[i] = in.nextInt();
            out.append(Decode.decode(values)).append('\n');
        }
        System.out.print(out);
    }
}
