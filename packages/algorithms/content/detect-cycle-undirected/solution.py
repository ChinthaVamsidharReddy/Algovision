from collections import deque


def has_cycle(edges, vertices):                           # @a entry
    adj = [[False] * vertices for _ in range(vertices)]   # @a build-graph
    for k in range(0, len(edges) - 1, 2):                 # @a build-graph
        adj[edges[k]][edges[k + 1]] = True                # @a build-graph
        adj[edges[k + 1]][edges[k]] = True                # @a build-graph
    seen = [False] * vertices                             # @a init-visited
    parent = [-1] * vertices                              # @a init-visited
    for s in range(vertices):                             # @a outer-loop
        if seen[s]: continue                              # @a outer-loop
        queue = deque([s])                                # @a enqueue-start
        seen[s] = True                                    # @a enqueue-start
        while queue:                                      # @a loop
            u = queue.popleft()                           # @a dequeue
            for v in range(vertices):                     # @a neighbors-loop
                if adj[u][v] and not seen[v]:             # @a check-neighbor
                    seen[v] = True                        # @a enqueue
                    parent[v] = u                         # @a enqueue
                    queue.append(v)                       # @a enqueue
                elif adj[u][v] and v != parent[u]:        # @a cycle-check
                    return 1                              # @a cycle-found
    return 0                                              # @a finish
