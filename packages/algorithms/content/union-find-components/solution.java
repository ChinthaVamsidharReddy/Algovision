class UnionFind {
    static int findRoot(int[] parent, int x) {
        while (parent[x] != x) {                          // @a find-loop
            parent[x] = parent[parent[x]];                // @a compress
            x = parent[x];                                // @a climb
        }
        return x;                                         // @a found-root
    }

    static int components(int[] edges, int vertices) {    // @a entry
        int[] parent = new int[vertices];                 // @a init-parents
        for (int i = 0; i < vertices; i++) {              // @a init-parents
            parent[i] = i;                                // @a init-parents
        }
        int count = vertices;                             // @a init-parents
        for (int k = 0; k + 1 < edges.length; k += 2) {   // @a edge-loop
            int a = findRoot(parent, edges[k]);           // @a find-a
            int b = findRoot(parent, edges[k + 1]);       // @a find-b
            if (a != b) {                                 // @a check-roots
                parent[b] = a;                            // @a union
                count--;                                  // @a union
            }
        }
        return count;                                     // @a finish
    }
}
