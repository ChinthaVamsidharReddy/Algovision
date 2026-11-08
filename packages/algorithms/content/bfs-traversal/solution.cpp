int bfs(const int edges[], int m, int vertices, int start, int order[]) {// @a entry
    int adj[8][8] = {{0}};                                // @a build-graph
    for (int k = 0; k + 1 < m; k += 2) {                  // @a build-graph
        adj[edges[k]][edges[k + 1]] = 1;                  // @a build-graph
        adj[edges[k + 1]][edges[k]] = 1;                  // @a build-graph
    }
    int seen[8] = {0};                                    // @a init-visited
    int queue[8];                                         // @a init-visited
    int head = 0, tail = 0, count = 0;                    // @a init-visited
    seen[start] = 1;                                      // @a enqueue-start
    queue[tail++] = start;                                // @a enqueue-start
    while (head < tail) {                                 // @a loop
        int u = queue[head++];                            // @a dequeue
        order[count++] = u;                               // @a visit
        for (int v = 0; v < vertices; v++) {              // @a neighbors-loop
            if (adj[u][v] && !seen[v]) {                  // @a check-neighbor
                seen[v] = 1;                              // @a enqueue
                queue[tail++] = v;                        // @a enqueue
            }
        }
    }
    return count;                                         // @a finish
}
