class ShortestPath {
    static int[] shortest(int[] edges, int vertices, int start) {// @a entry
        boolean[][] adj = new boolean[vertices][vertices];// @a build-graph
        for (int k = 0; k + 1 < edges.length; k += 2) {   // @a build-graph
            adj[edges[k]][edges[k + 1]] = true;           // @a build-graph
            adj[edges[k + 1]][edges[k]] = true;           // @a build-graph
        }
        int[] dist = new int[vertices];                   // @a init-dist
        java.util.Arrays.fill(dist, -1);                  // @a init-dist
        int[] queue = new int[vertices];                  // @a init-dist
        int head = 0, tail = 0;                           // @a init-dist
        dist[start] = 0;                                  // @a enqueue-start
        queue[tail++] = start;                            // @a enqueue-start
        while (head < tail) {                             // @a loop
            int u = queue[head++];                        // @a dequeue
            for (int v = 0; v < vertices; v++) {          // @a neighbors-loop
                if (adj[u][v] && dist[v] == -1) {         // @a check-neighbor
                    dist[v] = dist[u] + 1;                // @a relax
                    queue[tail++] = v;                    // @a relax
                }
            }
        }
        return dist;                                      // @a finish
    }
}
