def find_root(parent, x):
    while parent[x] != x:                                 # @a find-loop
        parent[x] = parent[parent[x]]                     # @a compress
        x = parent[x]                                     # @a climb
    return x                                              # @a found-root


def components(edges, vertices):                          # @a entry
    parent = list(range(vertices))                        # @a init-parents
    count = vertices                                      # @a init-parents
    for k in range(0, len(edges) - 1, 2):                 # @a edge-loop
        a = find_root(parent, edges[k])                   # @a find-a
        b = find_root(parent, edges[k + 1])               # @a find-b
        if a != b:                                        # @a check-roots
            parent[b] = a                                 # @a union
            count -= 1                                    # @a union
    return count                                          # @a finish
