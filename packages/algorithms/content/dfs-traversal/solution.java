class Dfs {
    static boolean[][] adj;
    static boolean[] seen;
    static int[] order;
    static int count;

    static void visit(int u) {                            // @a call
        seen[u] = true;                                   // @a visit
        order[count++] = u;                               // @a visit
        for (int v = 0; v < adj.length; v++) {            // @a neighbors-loop
            if (adj[u][v] && !seen[v]) {                  // @a check-neighbor
                visit(v);                                 // @a recurse
            }
        }
    }

    static int[] dfs(int[] edges, int vertices, int start) {// @a entry
        adj = new boolean[vertices][vertices];            // @a build-graph
        for (int k = 0; k + 1 < edges.length; k += 2) {   // @a build-graph
            adj[edges[k]][edges[k + 1]] = true;           // @a build-graph
            adj[edges[k + 1]][edges[k]] = true;           // @a build-graph
        }
        seen = new boolean[vertices];                     // @a init-visited
        order = new int[vertices];                        // @a init-visited
        count = 0;                                        // @a init-visited
        visit(start);                                     // @a start-call
        return java.util.Arrays.copyOf(order, count);     // @a finish
    }
}
