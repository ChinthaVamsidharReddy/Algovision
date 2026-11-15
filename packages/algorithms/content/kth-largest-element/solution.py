def kth_largest(values, k):                      # @a entry
    heap = []
    for v in values:                             # @a next
        if len(heap) < k:                        # @a check-size
            heap.append(v)                       # @a push
            child = len(heap) - 1                # @a push
            while child > 0:                     # @a sift-up
                parent = (child - 1) // 2        # @a sift-up
                if heap[parent] <= heap[child]:  # @a sift-up
                    break                        # @a sift-up
                heap[parent], heap[child] = heap[child], heap[parent]   # @a sift-up
                child = parent                   # @a sift-up
        elif v > heap[0]:                        # @a compare-root
            heap[0] = v                          # @a replace
            root = 0                             # @a replace
            while True:                          # @a sift-down
                smallest = root                  # @a sift-down
                left = 2 * root + 1              # @a sift-down
                right = left + 1                 # @a sift-down
                if left < k and heap[left] < heap[smallest]: smallest = left       # @a sift-down
                if right < k and heap[right] < heap[smallest]: smallest = right    # @a sift-down
                if smallest == root: break       # @a sift-down
                heap[root], heap[smallest] = heap[smallest], heap[root]   # @a sift-down
                root = smallest                  # @a sift-down
    return heap[0]                               # @a finish
