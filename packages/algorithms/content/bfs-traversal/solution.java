class Bfs {
    static int[] bfs(int[] edges, int vertices, int start) {// @a entry
        boolean[][] adj = new boolean[vertices][vertices];// @a build-graph
        for (int k = 0; k + 1 < edges.length; k += 2) {   // @a build-graph
            adj[edges[k]][edges[k + 1]] = true;           // @a build-graph
            adj[edges[k + 1]][edges[k]] = true;           // @a build-graph
        }
        boolean[] seen = new boolean[vertices];           // @a init-visited
        int[] queue = new int[vertices];                  // @a init-visited
        int[] order = new int[vertices];                  // @a init-visited
        int head = 0, tail = 0, count = 0;                // @a init-visited
        seen[start] = true;                               // @a enqueue-start
        queue[tail++] = start;                            // @a enqueue-start
        while (head < tail) {                             // @a loop
            int u = queue[head++];                        // @a dequeue
            order[count++] = u;                           // @a visit
            for (int v = 0; v < vertices; v++) {          // @a neighbors-loop
                if (adj[u][v] && !seen[v]) {              // @a check-neighbor
                    seen[v] = true;                       // @a enqueue
                    queue[tail++] = v;                    // @a enqueue
                }
            }
        }
        return java.util.Arrays.copyOf(order, count);     // @a finish
    }
}
