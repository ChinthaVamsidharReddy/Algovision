static int find_root(const int parent[], int x) {
    while (parent[x] != x) { x = parent[x]; }
    return x;
}

int kruskal_total(const int edges[], int len, int vertices) {// @a entry
    int m = len / 3;
    int order[32];                                        // @a sort-edges
    for (int i = 0; i < m; i++) { order[i] = i; }         // @a sort-edges
    for (int i = 1; i < m; i++) {                         // @a sort-edges
        int j = i;                                        // @a sort-edges
        while (j > 0 && edges[3 * order[j - 1] + 2] > edges[3 * order[j] + 2]) {// @a sort-edges
            int tmp = order[j];                           // @a sort-edges
            order[j] = order[j - 1];                      // @a sort-edges
            order[j - 1] = tmp;                           // @a sort-edges
            j--;                                          // @a sort-edges
        }
    }
    int parent[8];                                        // @a init-parents
    for (int i = 0; i < vertices; i++) { parent[i] = i; } // @a init-parents
    int total = 0;                                        // @a init-parents
    for (int k = 0; k < m; k++) {                         // @a edge-loop
        int e = order[k];                                 // @a edge-loop
        int a = find_root(parent, edges[3 * e]);          // @a find
        int b = find_root(parent, edges[3 * e + 1]);      // @a find
        if (a != b) {                                     // @a check-roots
            parent[b] = a;                                // @a take-edge
            total += edges[3 * e + 2];                    // @a take-edge
        }
    }
    return total;                                         // @a finish
}
