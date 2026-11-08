class NextGreater {
    static int[] nextGreater(int[] values) {             // @a entry
        int n = values.length;
        int[] result = new int[n];
        java.util.Arrays.fill(result, -1);               // @a init-result
        int[] stack = new int[n];
        int top = 0;
        for (int i = 0; i < n; i++) {                    // @a loop
            while (top > 0 && values[stack[top - 1]] < values[i]) {   // @a while-check
                result[stack[--top]] = values[i];        // @a pop-assign
            }
            stack[top++] = i;                            // @a push
        }
        return result;                                   // @a finish
    }
}
