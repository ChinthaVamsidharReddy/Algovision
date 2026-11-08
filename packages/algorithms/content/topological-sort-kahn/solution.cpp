int topo(const int edges[], int m, int vertices, int order[]) {// @a entry
    int adj[8][8] = {{0}};                                // @a build-graph
    for (int k = 0; k + 1 < m; k += 2) {                  // @a build-graph
        adj[edges[k]][edges[k + 1]] = 1;                  // @a build-graph
    }
    int indeg[8] = {0};                                   // @a compute-indegree
    for (int u = 0; u < vertices; u++) {                  // @a compute-indegree
        for (int v = 0; v < vertices; v++) {              // @a compute-indegree
            if (adj[u][v]) { indeg[v]++; }                // @a compute-indegree
        }
    }
    int queue[8];
    int head = 0, tail = 0, count = 0;
    for (int v = 0; v < vertices; v++) {                  // @a enqueue-zero
        if (indeg[v] == 0) {                              // @a enqueue-zero
            queue[tail++] = v;                            // @a enqueue-zero
        }
    }
    while (head < tail) {                                 // @a loop
        int u = queue[head++];                            // @a dequeue
        order[count++] = u;                               // @a emit
        for (int v = 0; v < vertices; v++) {              // @a neighbors-loop
            if (adj[u][v]) {                              // @a check-neighbor
                indeg[v]--;                               // @a decrement
                if (indeg[v] == 0) {                      // @a enqueue
                    queue[tail++] = v;                    // @a enqueue
                }
            }
        }
    }
    if (count < vertices) {                               // @a cycle-check
        return 0;                                         // @a cycle-found
    }
    return count;                                         // @a finish
}
