def find_root(parent, x):
    while parent[x] != x:
        x = parent[x]
    return x


def kruskal_total(edges, vertices):                       # @a entry
    m = len(edges) // 3
    order = list(range(m))                                # @a sort-edges
    for i in range(1, m):                                 # @a sort-edges
        j = i                                             # @a sort-edges
        while j > 0 and edges[3 * order[j - 1] + 2] > edges[3 * order[j] + 2]:# @a sort-edges
            order[j - 1], order[j] = order[j], order[j - 1]# @a sort-edges
            j -= 1                                        # @a sort-edges
    parent = list(range(vertices))                        # @a init-parents
    total = 0                                             # @a init-parents
    for e in order:                                       # @a edge-loop
        a = find_root(parent, edges[3 * e])               # @a find
        b = find_root(parent, edges[3 * e + 1])           # @a find
        if a != b:                                        # @a check-roots
            parent[b] = a                                 # @a take-edge
            total += edges[3 * e + 2]                     # @a take-edge
    return total                                          # @a finish
