class MinJumps {
    static int minJumps(int[] values) {                  // @a entry
        int n = values.length;
        if (n <= 1) { return 0; }                        // @a single
        int jumps = 0, curEnd = 0, farthest = 0;         // @a init
        for (int i = 0; i < n - 1; i++) {                // @a loop
            farthest = Math.max(farthest, i + values[i]);   // @a extend
            if (i == curEnd) {                           // @a boundary
                jumps++;                                 // @a jump
                curEnd = farthest;                       // @a jump
                if (curEnd >= n - 1) { return jumps; }   // @a finish
            }
        }
        return -1;                                       // @a unreachable
    }
}
