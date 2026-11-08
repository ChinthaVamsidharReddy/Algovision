import java.util.Arrays;
import java.util.Scanner;

public class Main {
    static int[] build(int[] keys, int size) {
        int[] table = new int[size];
        Arrays.fill(table, -1);
        for (int key : keys) {
            int index = key % size;
            int tries = 0;
            while (table[index] != -1 && tries < size) {
                index = (index + 1) % size;
                tries++;
            }
            if (tries < size) table[index] = key;
        }
        return table;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int cases = in.nextInt();
        StringBuilder out = new StringBuilder();
        for (int c = 0; c < cases; c++) {
            int n = in.nextInt();
            int[] keys = new int[n];
            for (int i = 0; i < n; i++) keys[i] = in.nextInt();
            int size = in.nextInt();
            int key = in.nextInt();
            out.append(HashTable.search(build(keys, size), key)).append('\n');
        }
        System.out.print(out);
    }
}
