int shortest(const int edges[], int m, int vertices, int start, int dist[]) {// @a entry
    int adj[8][8] = {{0}};                                // @a build-graph
    for (int k = 0; k + 1 < m; k += 2) {                  // @a build-graph
        adj[edges[k]][edges[k + 1]] = 1;                  // @a build-graph
        adj[edges[k + 1]][edges[k]] = 1;                  // @a build-graph
    }
    for (int i = 0; i < vertices; i++) {                  // @a init-dist
        dist[i] = -1;                                     // @a init-dist
    }
    int queue[8];                                         // @a init-dist
    int head = 0, tail = 0;                               // @a init-dist
    dist[start] = 0;                                      // @a enqueue-start
    queue[tail++] = start;                                // @a enqueue-start
    while (head < tail) {                                 // @a loop
        int u = queue[head++];                            // @a dequeue
        for (int v = 0; v < vertices; v++) {              // @a neighbors-loop
            if (adj[u][v] && dist[v] == -1) {             // @a check-neighbor
                dist[v] = dist[u] + 1;                    // @a relax
                queue[tail++] = v;                        // @a relax
            }
        }
    }
    return vertices;                                      // @a finish
}
