class KthLargest {
    static int kthLargest(int[] values, int k) {         // @a entry
        int[] heap = new int[k];
        int size = 0;
        for (int v : values) {                           // @a next
            if (size < k) {                              // @a check-size
                int child = size;                        // @a push
                heap[size++] = v;                        // @a push
                while (child > 0) {                      // @a sift-up
                    int parent = (child - 1) / 2;        // @a sift-up
                    if (heap[parent] <= heap[child]) { break; }   // @a sift-up
                    int tmp = heap[parent];              // @a sift-up
                    heap[parent] = heap[child];          // @a sift-up
                    heap[child] = tmp;                   // @a sift-up
                    child = parent;                      // @a sift-up
                }
            } else if (v > heap[0]) {                    // @a compare-root
                heap[0] = v;                             // @a replace
                int root = 0;                            // @a replace
                while (true) {                           // @a sift-down
                    int smallest = root;                 // @a sift-down
                    int left = 2 * root + 1;             // @a sift-down
                    int right = left + 1;                // @a sift-down
                    if (left < k && heap[left] < heap[smallest]) { smallest = left; }     // @a sift-down
                    if (right < k && heap[right] < heap[smallest]) { smallest = right; }  // @a sift-down
                    if (smallest == root) { break; }     // @a sift-down
                    int tmp = heap[root];                // @a sift-down
                    heap[root] = heap[smallest];         // @a sift-down
                    heap[smallest] = tmp;                // @a sift-down
                    root = smallest;                     // @a sift-down
                }
            }
        }
        return heap[0];                                  // @a finish
    }
}
