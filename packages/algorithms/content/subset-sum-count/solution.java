class SubsetSum {
    static int count(int[] values, int target) {         // @a entry
        return walk(values, 0, 0, target);
    }

    static int walk(int[] values, int i, int sum, int target) {
        if (sum > target) { return 0; }                  // @a prune
        if (i == values.length) { return sum == target ? 1 : 0; }   // @a base-case
        int withIt = walk(values, i + 1, sum + values[i], target);  // @a include
        int without = walk(values, i + 1, sum, target);  // @a exclude
        return withIt + without;                         // @a finish
    }
}
