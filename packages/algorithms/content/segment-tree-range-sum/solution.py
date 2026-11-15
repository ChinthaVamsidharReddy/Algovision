def segment_tree_range_sum(values, left, right): # @a entry
    n = len(values)
    tree = [0] * (4 * n)                         # @a init-tree

    def build(node, lo, hi):                     # @a build
        if lo == hi:
            tree[node] = values[lo]              # @a build-leaf
            return
        mid = (lo + hi) // 2
        build(2 * node, lo, mid)                 # @a build-children
        build(2 * node + 1, mid + 1, hi)         # @a build-children
        tree[node] = tree[2 * node] + tree[2 * node + 1]   # @a build-sum

    def query(node, lo, hi):                     # @a query
        if right < lo or hi < left: return 0     # @a query-outside
        if left <= lo and hi <= right: return tree[node]   # @a query-inside
        mid = (lo + hi) // 2
        return query(2 * node, lo, mid) + query(2 * node + 1, mid + 1, hi)   # @a query-split

    build(1, 0, n - 1)
    return query(1, 0, n - 1)                    # @a finish
