def fenwick_prefix_sum(values, index):           # @a entry
    n = len(values)
    tree = [0] * (n + 1)                         # @a init-tree
    for i in range(1, n + 1):                    # @a build
        j = i                                    # @a build
        while j <= n:
            tree[j] += values[i - 1]             # @a build-add
            j += j & -j                          # @a build-climb
    total = 0                                    # @a query
    j = index + 1                                # @a query
    while j > 0:
        total += tree[j]                         # @a query-add
        j -= j & -j                              # @a query-climb
    return total                                 # @a finish
