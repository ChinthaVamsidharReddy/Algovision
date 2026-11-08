int hasCycle(const int edges[], int m, int vertices) {    // @a entry
    int adj[8][8] = {{0}};                                // @a build-graph
    for (int k = 0; k + 1 < m; k += 2) {                  // @a build-graph
        adj[edges[k]][edges[k + 1]] = 1;                  // @a build-graph
        adj[edges[k + 1]][edges[k]] = 1;                  // @a build-graph
    }
    int seen[8] = {0};                                    // @a init-visited
    int parent[8];                                        // @a init-visited
    for (int i = 0; i < vertices; i++) {                  // @a init-visited
        parent[i] = -1;                                   // @a init-visited
    }
    int queue[8];                                         // @a init-visited
    for (int s = 0; s < vertices; s++) {                  // @a outer-loop
        if (seen[s]) { continue; }                        // @a outer-loop
        int head = 0, tail = 0;                           // @a enqueue-start
        seen[s] = 1;                                      // @a enqueue-start
        queue[tail++] = s;                                // @a enqueue-start
        while (head < tail) {                             // @a loop
            int u = queue[head++];                        // @a dequeue
            for (int v = 0; v < vertices; v++) {          // @a neighbors-loop
                if (adj[u][v] && !seen[v]) {              // @a check-neighbor
                    seen[v] = 1;                          // @a enqueue
                    parent[v] = u;                        // @a enqueue
                    queue[tail++] = v;                    // @a enqueue
                } else if (adj[u][v] && v != parent[u]) { // @a cycle-check
                    return 1;                             // @a cycle-found
                }
            }
        }
    }
    return 0;                                             // @a finish
}
