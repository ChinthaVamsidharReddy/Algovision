from collections import deque


def topo(edges, vertices):                                # @a entry
    adj = [[False] * vertices for _ in range(vertices)]   # @a build-graph
    for k in range(0, len(edges) - 1, 2):                 # @a build-graph
        adj[edges[k]][edges[k + 1]] = True                # @a build-graph
    indeg = [0] * vertices                                # @a compute-indegree
    for u in range(vertices):                             # @a compute-indegree
        for v in range(vertices):                         # @a compute-indegree
            if adj[u][v]: indeg[v] += 1                   # @a compute-indegree
    queue = deque()
    order = []
    for v in range(vertices):                             # @a enqueue-zero
        if indeg[v] == 0:                                 # @a enqueue-zero
            queue.append(v)                               # @a enqueue-zero
    while queue:                                          # @a loop
        u = queue.popleft()                               # @a dequeue
        order.append(u)                                   # @a emit
        for v in range(vertices):                         # @a neighbors-loop
            if adj[u][v]:                                 # @a check-neighbor
                indeg[v] -= 1                             # @a decrement
                if indeg[v] == 0:                         # @a enqueue
                    queue.append(v)                       # @a enqueue
    if len(order) < vertices:                             # @a cycle-check
        return []                                         # @a cycle-found
    return order                                          # @a finish
