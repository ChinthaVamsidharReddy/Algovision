from collections import deque


def shortest(edges, vertices, start):                     # @a entry
    adj = [[False] * vertices for _ in range(vertices)]   # @a build-graph
    for k in range(0, len(edges) - 1, 2):                 # @a build-graph
        adj[edges[k]][edges[k + 1]] = True                # @a build-graph
        adj[edges[k + 1]][edges[k]] = True                # @a build-graph
    dist = [-1] * vertices                                # @a init-dist
    queue = deque()                                       # @a init-dist
    dist[start] = 0                                       # @a enqueue-start
    queue.append(start)                                   # @a enqueue-start
    while queue:                                          # @a loop
        u = queue.popleft()                               # @a dequeue
        for v in range(vertices):                         # @a neighbors-loop
            if adj[u][v] and dist[v] == -1:               # @a check-neighbor
                dist[v] = dist[u] + 1                     # @a relax
                queue.append(v)                           # @a relax
    return dist                                           # @a finish
