int dijkstra(const int edges[], int m, int vertices, int start, int dist[]) {// @a entry
    const int INF = 1000000;
    int w[8][8] = {{0}};                                  // @a build-graph
    for (int k = 0; k + 2 < m; k += 3) {                  // @a build-graph
        w[edges[k]][edges[k + 1]] = edges[k + 2];         // @a build-graph
        w[edges[k + 1]][edges[k]] = edges[k + 2];         // @a build-graph
    }
    int done[8] = {0};                                    // @a init-dist
    for (int i = 0; i < vertices; i++) {                  // @a init-dist
        dist[i] = INF;                                    // @a init-dist
    }
    dist[start] = 0;                                      // @a init-dist
    for (int round = 0; round < vertices; round++) {      // @a loop
        int u = -1;                                       // @a select-min
        for (int i = 0; i < vertices; i++) {              // @a select-min
            if (!done[i] && dist[i] < INF && (u == -1 || dist[i] < dist[u])) {// @a select-min
                u = i;                                    // @a select-min
            }
        }
        if (u == -1) {                                    // @a unreachable-stop
            break;                                        // @a unreachable-stop
        }
        done[u] = 1;                                      // @a settle
        for (int v = 0; v < vertices; v++) {              // @a neighbors-loop
            if (w[u][v] > 0 && !done[v]) {                // @a check-neighbor
                if (dist[u] + w[u][v] < dist[v]) {        // @a check-neighbor
                    dist[v] = dist[u] + w[u][v];          // @a relax
                }
            }
        }
    }
    for (int i = 0; i < vertices; i++) {                  // @a finish
        if (dist[i] == INF) { dist[i] = -1; }             // @a finish
    }
    return vertices;                                      // @a finish
}
