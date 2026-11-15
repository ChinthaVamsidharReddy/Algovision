class Scc {
    static boolean[][] adj;
    static boolean[] seen;
    static int[] order;
    static int finished;
    static int[] comp;
    static int count;

    static void firstPass(int u) {                        // @a first-pass
        seen[u] = true;                                   // @a first-pass
        for (int v = 0; v < adj.length; v++) {            // @a first-pass
            if (adj[u][v] && !seen[v]) { firstPass(v); }  // @a first-pass
        }
        order[finished++] = u;                            // @a finish-time
    }

    static void secondPass(int u) {                       // @a second-pass
        comp[u] = count;                                  // @a second-pass
        for (int v = 0; v < adj.length; v++) {            // @a second-pass
            if (adj[v][u] && comp[v] < 0) { secondPass(v); }// @a second-pass
        }
    }

    static int countScc(int[] edges, int vertices) {      // @a entry
        adj = new boolean[vertices][vertices];            // @a build-graph
        for (int k = 0; k + 1 < edges.length; k += 2) {   // @a build-graph
            adj[edges[k]][edges[k + 1]] = true;           // @a build-graph
        }
        seen = new boolean[vertices];                     // @a init-visited
        order = new int[vertices];                        // @a init-visited
        finished = 0;                                     // @a init-visited
        for (int u = 0; u < vertices; u++) {              // @a first-loop
            if (!seen[u]) { firstPass(u); }               // @a first-loop
        }
        comp = new int[vertices];                         // @a second-init
        java.util.Arrays.fill(comp, -1);                  // @a second-init
        count = 0;                                        // @a second-init
        for (int k = vertices - 1; k >= 0; k--) {         // @a second-loop
            int u = order[k];                             // @a second-loop
            if (comp[u] < 0) {                            // @a second-loop
                secondPass(u);                            // @a new-component
                count++;                                  // @a new-component
            }
        }
        return count;                                     // @a finish
    }
}
