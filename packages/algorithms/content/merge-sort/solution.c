void merge(int values[], int temp[], int lo, int mid, int hi) {
    int i = lo, j = mid + 1, k = lo;                     // @a merge-init
    while (i <= mid && j <= hi) {
        if (values[i] <= values[j]) {                    // @a merge-compare
            temp[k++] = values[i++];                     // @a take-left
        } else {
            temp[k++] = values[j++];                     // @a take-right
        }
    }
    while (i <= mid) { temp[k++] = values[i++]; }        // @a copy-rest
    while (j <= hi) { temp[k++] = values[j++]; }         // @a copy-rest
    for (int t = lo; t <= hi; t++) { values[t] = temp[t]; }   // @a write-back
}

void merge_sort(int values[], int temp[], int lo, int hi) {  // @a entry
    if (lo >= hi) {                                      // @a base-case
        return;                                          // @a base-case
    }
    int mid = (lo + hi) / 2;                             // @a split
    merge_sort(values, temp, lo, mid);                   // @a recurse-left
    merge_sort(values, temp, mid + 1, hi);               // @a recurse-right
    merge(values, temp, lo, mid, hi);                    // @a merge-call
    return;                                              // @a finish
}
