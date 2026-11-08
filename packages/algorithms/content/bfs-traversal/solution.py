from collections import deque


def bfs(edges, vertices, start):                          # @a entry
    adj = [[False] * vertices for _ in range(vertices)]   # @a build-graph
    for k in range(0, len(edges) - 1, 2):                 # @a build-graph
        adj[edges[k]][edges[k + 1]] = True                # @a build-graph
        adj[edges[k + 1]][edges[k]] = True                # @a build-graph
    seen = [False] * vertices                             # @a init-visited
    queue = deque()                                       # @a init-visited
    order = []                                            # @a init-visited
    seen[start] = True                                    # @a enqueue-start
    queue.append(start)                                   # @a enqueue-start
    while queue:                                          # @a loop
        u = queue.popleft()                               # @a dequeue
        order.append(u)                                   # @a visit
        for v in range(vertices):                         # @a neighbors-loop
            if adj[u][v] and not seen[v]:                 # @a check-neighbor
                seen[v] = True                            # @a enqueue
                queue.append(v)                           # @a enqueue
    return order                                          # @a finish
