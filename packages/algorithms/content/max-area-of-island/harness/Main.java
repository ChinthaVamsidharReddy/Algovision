import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int cases = in.nextInt();
        StringBuilder out = new StringBuilder();
        for (int c = 0; c < cases; c++) {
            int rows = in.nextInt();
            int cols = in.nextInt();
            int[][] grid = new int[rows][cols];
            for (int r = 0; r < rows; r++) {
                for (int c2 = 0; c2 < cols; c2++) grid[r][c2] = in.nextInt();
            }
            out.append(Area.maxArea(grid)).append('\n');
        }
        System.out.print(out);
    }
}
