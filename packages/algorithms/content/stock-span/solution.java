class Span {
    static int[] span(int[] values) {                    // @a entry
        int n = values.length;
        int[] result = new int[n];
        int[] stack = new int[n];
        int top = 0;
        for (int i = 0; i < n; i++) {                    // @a loop
            while (top > 0 && values[stack[top - 1]] <= values[i]) {   // @a while-check
                top--;                                   // @a pop
            }
            result[i] = (top == 0) ? i + 1 : i - stack[top - 1];   // @a compute
            stack[top++] = i;                            // @a push
        }
        return result;                                   // @a finish
    }
}
