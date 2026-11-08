static int find_root(int parent[], int x) {
    while (parent[x] != x) {                              // @a find-loop
        parent[x] = parent[parent[x]];                    // @a compress
        x = parent[x];                                    // @a climb
    }
    return x;                                             // @a found-root
}

int components(const int edges[], int m, int vertices) {  // @a entry
    int parent[8];                                        // @a init-parents
    for (int i = 0; i < vertices; i++) {                  // @a init-parents
        parent[i] = i;                                    // @a init-parents
    }
    int count = vertices;                                 // @a init-parents
    for (int k = 0; k + 1 < m; k += 2) {                  // @a edge-loop
        int a = find_root(parent, edges[k]);              // @a find-a
        int b = find_root(parent, edges[k + 1]);          // @a find-b
        if (a != b) {                                     // @a check-roots
            parent[b] = a;                                // @a union
            count--;                                      // @a union
        }
    }
    return count;                                         // @a finish
}
