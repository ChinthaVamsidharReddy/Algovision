import java.util.Arrays;

class StackDemo {
    static int[] run(int[] values, int pops) {           // @a entry
        int[] stack = new int[values.length];
        int size = 0;
        for (int v : values) {
            stack[size] = v;                             // @a push
            size++;                                      // @a push
        }
        for (int k = 0; k < pops; k++) {
            if (size == 0) {                             // @a check-empty
                break;                                   // @a underflow
            }
            size--;                                      // @a pop
        }
        return Arrays.copyOf(stack, size);               // @a finish
    }
}
