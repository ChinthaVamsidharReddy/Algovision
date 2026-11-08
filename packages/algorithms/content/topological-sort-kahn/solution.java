class Topo {
    static int[] topo(int[] edges, int vertices) {        // @a entry
        boolean[][] adj = new boolean[vertices][vertices];// @a build-graph
        for (int k = 0; k + 1 < edges.length; k += 2) {   // @a build-graph
            adj[edges[k]][edges[k + 1]] = true;           // @a build-graph
        }
        int[] indeg = new int[vertices];                  // @a compute-indegree
        for (int u = 0; u < vertices; u++) {              // @a compute-indegree
            for (int v = 0; v < vertices; v++) {          // @a compute-indegree
                if (adj[u][v]) { indeg[v]++; }            // @a compute-indegree
            }
        }
        int[] queue = new int[vertices];
        int[] order = new int[vertices];
        int head = 0, tail = 0, count = 0;
        for (int v = 0; v < vertices; v++) {              // @a enqueue-zero
            if (indeg[v] == 0) {                          // @a enqueue-zero
                queue[tail++] = v;                        // @a enqueue-zero
            }
        }
        while (head < tail) {                             // @a loop
            int u = queue[head++];                        // @a dequeue
            order[count++] = u;                           // @a emit
            for (int v = 0; v < vertices; v++) {          // @a neighbors-loop
                if (adj[u][v]) {                          // @a check-neighbor
                    indeg[v]--;                           // @a decrement
                    if (indeg[v] == 0) {                  // @a enqueue
                        queue[tail++] = v;                // @a enqueue
                    }
                }
            }
        }
        if (count < vertices) {                           // @a cycle-check
            return new int[0];                            // @a cycle-found
        }
        return order;                                     // @a finish
    }
}
