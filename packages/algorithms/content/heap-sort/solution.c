void sift_down(int values[], int root, int size) {   // @a sift-entry
    while (1) {
        int largest = root;                              // @a pick-largest
        int left = 2 * root + 1;                         // @a pick-largest
        int right = left + 1;                            // @a pick-largest
        if (left < size && values[left] > values[largest]) { largest = left; }       // @a compare-left
        if (right < size && values[right] > values[largest]) { largest = right; }    // @a compare-right
        if (largest == root) { return; }                // @a sift-done
        int tmp = values[root];                          // @a sift-swap
        values[root] = values[largest];                  // @a sift-swap
        values[largest] = tmp;                           // @a sift-swap
        root = largest;                                  // @a sift-move
    }
}

void heap_sort(int values[], int n) {                       // @a entry
    for (int start = n / 2 - 1; start >= 0; start--) {  // @a build-heap
        sift_down(values, start, n);
    }
    for (int end = n - 1; end > 0; end--) {             // @a extract-loop
        int tmp = values[0];                             // @a extract-swap
        values[0] = values[end];                         // @a extract-swap
        values[end] = tmp;                               // @a extract-swap
        sift_down(values, 0, end);
    }
    return;                                              // @a finish
}
