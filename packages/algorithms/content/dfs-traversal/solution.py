def dfs(edges, vertices, start):                          # @a entry
    adj = [[False] * vertices for _ in range(vertices)]   # @a build-graph
    for k in range(0, len(edges) - 1, 2):                 # @a build-graph
        adj[edges[k]][edges[k + 1]] = True                # @a build-graph
        adj[edges[k + 1]][edges[k]] = True                # @a build-graph
    seen = [False] * vertices                             # @a init-visited
    order = []                                            # @a init-visited

    def visit(u):                                         # @a call
        seen[u] = True                                    # @a visit
        order.append(u)                                   # @a visit
        for v in range(vertices):                         # @a neighbors-loop
            if adj[u][v] and not seen[v]:                 # @a check-neighbor
                visit(v)                                  # @a recurse

    visit(start)                                          # @a start-call
    return order                                          # @a finish
