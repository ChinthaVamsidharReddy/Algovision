class TrieCount {
    static int countDistinct(String s) {                  // @a entry
        int n = s.length();
        int[][] next = new int[n * (n + 1) / 2 + 1][26];  // @a init
        int nodes = 1;                                    // @a init
        int count = 0;                                    // @a init
        for (int i = 0; i < n; i++) {
            int node = 0;                                 // @a suffix
            for (int j = i; j < n; j++) {
                int c = s.charAt(j) - 'a';
                if (next[node][c] == 0) {                 // @a check
                    next[node][c] = nodes++;              // @a create
                    count++;                              // @a create
                }
                node = next[node][c];                     // @a descend
            }
        }
        return count;                                     // @a finish
    }
}
