static void first_pass(int u, int vertices, int adj[8][8], int seen[8], int order[8], int *finished) {// @a first-pass
    seen[u] = 1;                                          // @a first-pass
    for (int v = 0; v < vertices; v++) {                  // @a first-pass
        if (adj[u][v] && !seen[v]) { first_pass(v, vertices, adj, seen, order, finished); }// @a first-pass
    }
    order[(*finished)++] = u;                             // @a finish-time
}

static void second_pass(int u, int vertices, int adj[8][8], int comp[8], int count) {// @a second-pass
    comp[u] = count;                                      // @a second-pass
    for (int v = 0; v < vertices; v++) {                  // @a second-pass
        if (adj[v][u] && comp[v] < 0) { second_pass(v, vertices, adj, comp, count); }// @a second-pass
    }
}

int count_scc(const int edges[], int len, int vertices) { // @a entry
    int adj[8][8] = {{0}};                                // @a build-graph
    for (int k = 0; k + 1 < len; k += 2) {                // @a build-graph
        adj[edges[k]][edges[k + 1]] = 1;                  // @a build-graph
    }
    int seen[8] = {0};                                    // @a init-visited
    int order[8] = {0};                                   // @a init-visited
    int finished = 0;                                     // @a init-visited
    for (int u = 0; u < vertices; u++) {                  // @a first-loop
        if (!seen[u]) { first_pass(u, vertices, adj, seen, order, &finished); }// @a first-loop
    }
    int comp[8];                                          // @a second-init
    for (int i = 0; i < vertices; i++) { comp[i] = -1; }  // @a second-init
    int count = 0;                                        // @a second-init
    for (int k = vertices - 1; k >= 0; k--) {             // @a second-loop
        int u = order[k];                                 // @a second-loop
        if (comp[u] < 0) {                                // @a second-loop
            second_pass(u, vertices, adj, comp, count);   // @a new-component
            count++;                                      // @a new-component
        }
    }
    return count;                                         // @a finish
}
