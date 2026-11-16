class TrieOps {
    static int run(int[] ops) {                           // @a entry
        int[][] next = new int[ops.length + 1][26];       // @a init
        boolean[] end = new boolean[ops.length + 1];      // @a init
        int nodes = 1;                                    // @a init
        int answers = 0;                                  // @a init
        int i = 0;
        while (i < ops.length) {
            int code = ops[i];
            int len = ops[i + 1];
            int node = 0;                                 // @a op
            boolean found = true;                         // @a op
            for (int j = 0; j < len; j++) {
                int c = ops[i + 2 + j] - 'a';
                if (next[node][c] == 0) {                 // @a check
                    if (code == 1) {
                        next[node][c] = nodes++;          // @a create
                    } else {
                        found = false;                    // @a miss
                        break;                            // @a miss
                    }
                }
                node = next[node][c];                     // @a descend
            }
            if (code == 1) {
                end[node] = true;                         // @a mark
            } else if (found) {
                answers += (code == 3 || end[node]) ? 1 : 0;// @a answer
            }
            i += 2 + len;
        }
        return answers;                                   // @a finish
    }
}
