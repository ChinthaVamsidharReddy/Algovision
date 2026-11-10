import java.util.Arrays;


class Factors {
    static int[] factorize(int n) {                      // @a entry
        int[] out = new int[16];
        int count = 0;
        int d = 2;                                       // @a init
        while (d * d <= n) {                             // @a loop
            if (n % d == 0) {                            // @a check
                out[count++] = d;                        // @a divide
                n /= d;                                  // @a divide
            } else {
                d++;                                     // @a next
            }
        }
        if (n > 1) { out[count++] = n; }                 // @a remainder
        return Arrays.copyOf(out, count);                // @a finish
    }
}
