class Components {
    static int components(int[] edges, int vertices) {    // @a entry
        boolean[][] adj = new boolean[vertices][vertices];// @a build-graph
        for (int k = 0; k + 1 < edges.length; k += 2) {   // @a build-graph
            adj[edges[k]][edges[k + 1]] = true;           // @a build-graph
            adj[edges[k + 1]][edges[k]] = true;           // @a build-graph
        }
        int[] comp = new int[vertices];                   // @a init-labels
        java.util.Arrays.fill(comp, -1);                  // @a init-labels
        int[] stack = new int[vertices];                  // @a init-labels
        int count = 0;                                    // @a init-labels
        for (int s = 0; s < vertices; s++) {              // @a outer-loop
            if (comp[s] == -1) {                          // @a outer-loop
                int top = 0;                              // @a new-component
                comp[s] = count;                          // @a new-component
                stack[top++] = s;                         // @a new-component
                while (top > 0) {                         // @a pop
                    int u = stack[--top];                 // @a pop
                    for (int v = 0; v < vertices; v++) {  // @a neighbors-loop
                        if (adj[u][v] && comp[v] == -1) { // @a check-neighbor
                            comp[v] = count;              // @a label
                            stack[top++] = v;             // @a label
                        }
                    }
                }
                count++;                                  // @a next-component
            }
        }
        return count;                                     // @a finish
    }
}
