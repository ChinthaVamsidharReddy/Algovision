class SegmentTree {
    static int[] values;
    static int[] tree;
    static int from;
    static int to;

    static void build(int node, int lo, int hi) {        // @a build
        if (lo == hi) {
            tree[node] = values[lo];                     // @a build-leaf
            return;
        }
        int mid = (lo + hi) / 2;
        build(2 * node, lo, mid);                        // @a build-children
        build(2 * node + 1, mid + 1, hi);                // @a build-children
        tree[node] = tree[2 * node] + tree[2 * node + 1];   // @a build-sum
    }

    static int query(int node, int lo, int hi) {         // @a query
        if (to < lo || hi < from) { return 0; }          // @a query-outside
        if (from <= lo && hi <= to) { return tree[node]; }   // @a query-inside
        int mid = (lo + hi) / 2;
        return query(2 * node, lo, mid) + query(2 * node + 1, mid + 1, hi);   // @a query-split
    }

    static int rangeSum(int[] data, int left, int right) {   // @a entry
        values = data;
        tree = new int[4 * data.length];                 // @a init-tree
        build(1, 0, data.length - 1);
        from = left;
        to = right;
        return query(1, 0, data.length - 1);             // @a finish
    }
}
