void heapify(int values[], int n) {                      // @a entry
    for (int start = n / 2 - 1; start >= 0; start--) {   // @a start
        int root = start;                                // @a start
        while (1) {
            int smallest = root;                         // @a pick-smallest
            int left = 2 * root + 1;                     // @a pick-smallest
            int right = left + 1;                        // @a pick-smallest
            if (left < n && values[left] < values[smallest]) { smallest = left; }      // @a compare-left
            if (right < n && values[right] < values[smallest]) { smallest = right; }   // @a compare-right
            if (smallest == root) { break; }             // @a stop
            int tmp = values[root];                      // @a swap
            values[root] = values[smallest];             // @a swap
            values[smallest] = tmp;                      // @a swap
            root = smallest;                             // @a swap
        }
    }
    return;                                              // @a finish
}
