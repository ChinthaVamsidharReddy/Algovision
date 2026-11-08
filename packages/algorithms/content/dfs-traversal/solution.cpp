static void visit(int u, int vertices, int adj[8][8], int seen[8], int order[], int *count) {// @a call
    seen[u] = 1;                                          // @a visit
    order[(*count)++] = u;                                // @a visit
    for (int v = 0; v < vertices; v++) {                  // @a neighbors-loop
        if (adj[u][v] && !seen[v]) {                      // @a check-neighbor
            visit(v, vertices, adj, seen, order, count);  // @a recurse
        }
    }
}

int dfs(const int edges[], int m, int vertices, int start, int order[]) {// @a entry
    int adj[8][8] = {{0}};                                // @a build-graph
    for (int k = 0; k + 1 < m; k += 2) {                  // @a build-graph
        adj[edges[k]][edges[k + 1]] = 1;                  // @a build-graph
        adj[edges[k + 1]][edges[k]] = 1;                  // @a build-graph
    }
    int seen[8] = {0};                                    // @a init-visited
    int count = 0;                                        // @a init-visited
    visit(start, vertices, adj, seen, order, &count);     // @a start-call
    return count;                                         // @a finish
}
