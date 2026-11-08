INF = 1000000


def dijkstra(edges, vertices, start):                     # @a entry
    w = [[0] * vertices for _ in range(vertices)]         # @a build-graph
    for k in range(0, len(edges) - 2, 3):                 # @a build-graph
        w[edges[k]][edges[k + 1]] = edges[k + 2]          # @a build-graph
        w[edges[k + 1]][edges[k]] = edges[k + 2]          # @a build-graph
    dist = [INF] * vertices                               # @a init-dist
    done = [False] * vertices                             # @a init-dist
    dist[start] = 0                                       # @a init-dist
    for _ in range(vertices):                             # @a loop
        u = -1                                            # @a select-min
        for i in range(vertices):                         # @a select-min
            if not done[i] and dist[i] < INF and (u == -1 or dist[i] < dist[u]):# @a select-min
                u = i                                     # @a select-min
        if u == -1:                                       # @a unreachable-stop
            break                                         # @a unreachable-stop
        done[u] = True                                    # @a settle
        for v in range(vertices):                         # @a neighbors-loop
            if w[u][v] > 0 and not done[v]:               # @a check-neighbor
                if dist[u] + w[u][v] < dist[v]:           # @a check-neighbor
                    dist[v] = dist[u] + w[u][v]           # @a relax
    return [-1 if d == INF else d for d in dist]          # @a finish
