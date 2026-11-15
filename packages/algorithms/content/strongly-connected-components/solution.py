def count_scc(edges, vertices):                           # @a entry
    adj = [[False] * vertices for _ in range(vertices)]   # @a build-graph
    for k in range(0, len(edges) - 1, 2):                 # @a build-graph
        adj[edges[k]][edges[k + 1]] = True                # @a build-graph
    seen = [False] * vertices                             # @a init-visited
    order = []                                            # @a init-visited

    def first_pass(u):                                    # @a first-pass
        seen[u] = True                                    # @a first-pass
        for v in range(vertices):                         # @a first-pass
            if adj[u][v] and not seen[v]: first_pass(v)   # @a first-pass
        order.append(u)                                   # @a finish-time

    for u in range(vertices):                             # @a first-loop
        if not seen[u]: first_pass(u)                     # @a first-loop
    comp = [-1] * vertices                                # @a second-init
    count = 0                                             # @a second-init

    def second_pass(u):                                   # @a second-pass
        comp[u] = count                                   # @a second-pass
        for v in range(vertices):                         # @a second-pass
            if adj[v][u] and comp[v] < 0: second_pass(v)  # @a second-pass

    for u in reversed(order):                             # @a second-loop
        if comp[u] < 0:                                   # @a second-loop
            second_pass(u)                                # @a new-component
            count += 1                                    # @a new-component
    return count                                          # @a finish
