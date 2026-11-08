class Cycle {
    static int hasCycle(int[] edges, int vertices) {      // @a entry
        boolean[][] adj = new boolean[vertices][vertices];// @a build-graph
        for (int k = 0; k + 1 < edges.length; k += 2) {   // @a build-graph
            adj[edges[k]][edges[k + 1]] = true;           // @a build-graph
            adj[edges[k + 1]][edges[k]] = true;           // @a build-graph
        }
        boolean[] seen = new boolean[vertices];           // @a init-visited
        int[] parent = new int[vertices];                 // @a init-visited
        java.util.Arrays.fill(parent, -1);                // @a init-visited
        int[] queue = new int[vertices];                  // @a init-visited
        for (int s = 0; s < vertices; s++) {              // @a outer-loop
            if (seen[s]) { continue; }                    // @a outer-loop
            int head = 0, tail = 0;                       // @a enqueue-start
            seen[s] = true;                               // @a enqueue-start
            queue[tail++] = s;                            // @a enqueue-start
            while (head < tail) {                         // @a loop
                int u = queue[head++];                    // @a dequeue
                for (int v = 0; v < vertices; v++) {      // @a neighbors-loop
                    if (adj[u][v] && !seen[v]) {          // @a check-neighbor
                        seen[v] = true;                   // @a enqueue
                        parent[v] = u;                    // @a enqueue
                        queue[tail++] = v;                // @a enqueue
                    } else if (adj[u][v] && v != parent[u]) {// @a cycle-check
                        return 1;                         // @a cycle-found
                    }
                }
            }
        }
        return 0;                                         // @a finish
    }
}
