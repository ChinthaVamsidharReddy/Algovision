def components(edges, vertices):                          # @a entry
    adj = [[False] * vertices for _ in range(vertices)]   # @a build-graph
    for k in range(0, len(edges) - 1, 2):                 # @a build-graph
        adj[edges[k]][edges[k + 1]] = True                # @a build-graph
        adj[edges[k + 1]][edges[k]] = True                # @a build-graph
    comp = [-1] * vertices                                # @a init-labels
    stack = []                                            # @a init-labels
    count = 0                                             # @a init-labels
    for s in range(vertices):                             # @a outer-loop
        if comp[s] == -1:                                 # @a outer-loop
            comp[s] = count                               # @a new-component
            stack.append(s)                               # @a new-component
            while stack:                                  # @a pop
                u = stack.pop()                           # @a pop
                for v in range(vertices):                 # @a neighbors-loop
                    if adj[u][v] and comp[v] == -1:       # @a check-neighbor
                        comp[v] = count                   # @a label
                        stack.append(v)                   # @a label
            count += 1                                    # @a next-component
    return count                                          # @a finish
