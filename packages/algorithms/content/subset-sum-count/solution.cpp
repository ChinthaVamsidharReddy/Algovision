static int walk(const int values[], int n, int i, int sum, int target) {
    if (sum > target) { return 0; }                      // @a prune
    if (i == n) { return sum == target ? 1 : 0; }        // @a base-case
    int withIt = walk(values, n, i + 1, sum + values[i], target);   // @a include
    int without = walk(values, n, i + 1, sum, target);   // @a exclude
    return withIt + without;                             // @a finish
}

int countSubsets(const int values[], int n, int target) {        // @a entry
    return walk(values, n, 0, 0, target);
}
