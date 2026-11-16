class Repeated {
    static int longest(String s) {                        // @a entry
        int n = s.length();
        int size = n * (n + 1) / 2 + 1;
        int[][] next = new int[size][26];                 // @a init
        int[] seen = new int[size];                       // @a init
        int nodes = 1;                                    // @a init
        int best = 0;                                     // @a init
        for (int i = 0; i < n; i++) {
            int node = 0;                                 // @a suffix
            int depth = 0;                                // @a suffix
            for (int j = i; j < n; j++) {
                int c = s.charAt(j) - 'a';
                if (next[node][c] == 0) {                 // @a check
                    next[node][c] = nodes++;              // @a create
                }
                node = next[node][c];                     // @a descend
                seen[node]++;                             // @a descend
                depth++;                                  // @a descend
                if (seen[node] >= 2 && depth > best) {    // @a best
                    best = depth;                         // @a best
                }
            }
        }
        return best;                                      // @a finish
    }
}
