class Histogram {
    static int largest(int[] values) {                   // @a entry
        int n = values.length;
        int[] stack = new int[n + 1];
        int top = 0;
        int best = 0;
        for (int i = 0; i <= n; i++) {                   // @a loop
            int h = (i == n) ? 0 : values[i];            // @a loop
            while (top > 0 && values[stack[top - 1]] > h) {   // @a while-check
                int height = values[stack[--top]];       // @a pop-area
                int width = (top == 0) ? i : i - stack[top - 1] - 1;   // @a pop-area
                if (height * width > best) { best = height * width; }   // @a pop-area
            }
            stack[top++] = i;                            // @a push
        }
        return best;                                     // @a finish
    }
}
