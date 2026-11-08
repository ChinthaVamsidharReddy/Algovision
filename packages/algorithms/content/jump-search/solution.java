class JumpSearch {
    static int jumpSearch(int[] values, int target) {    // @a entry
        int n = values.length;
        int step = 1;                                    // @a init-step
        while ((step + 1) * (step + 1) <= n) { step++; } // @a init-step
        int prev = 0;                                    // @a init-prev
        int end = step < n ? step : n;                   // @a block-end
        while (prev < n && values[end - 1] < target) {   // @a jump-check
            prev = end;                                  // @a jump
            end = prev + step < n ? prev + step : n;     // @a block-end
        }
        for (int i = prev; i < end; i++) {               // @a linear-loop
            if (values[i] == target) {                   // @a linear-compare
                return i;                                // @a found
            }
        }
        return -1;                                       // @a not-found
    }
}
