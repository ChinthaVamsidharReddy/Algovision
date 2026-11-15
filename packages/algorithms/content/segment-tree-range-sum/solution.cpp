#include <vector>

static void build(const int values[], std::vector<int>& tree, int node, int lo, int hi) {   // @a build
    if (lo == hi) {
        tree[node] = values[lo];                         // @a build-leaf
        return;
    }
    int mid = (lo + hi) / 2;
    build(values, tree, 2 * node, lo, mid);              // @a build-children
    build(values, tree, 2 * node + 1, mid + 1, hi);      // @a build-children
    tree[node] = tree[2 * node] + tree[2 * node + 1];    // @a build-sum
}

static int query(const std::vector<int>& tree, int node, int lo, int hi, int from, int to) {   // @a query
    if (to < lo || hi < from) { return 0; }              // @a query-outside
    if (from <= lo && hi <= to) { return tree[node]; }   // @a query-inside
    int mid = (lo + hi) / 2;
    return query(tree, 2 * node, lo, mid, from, to) + query(tree, 2 * node + 1, mid + 1, hi, from, to);   // @a query-split
}

int segmentTreeRangeSum(const int values[], int n, int left, int right) {   // @a entry
    std::vector<int> tree(4 * n, 0);                     // @a init-tree
    build(values, tree, 1, 0, n - 1);
    return query(tree, 1, 0, n - 1, left, right);        // @a finish
}
