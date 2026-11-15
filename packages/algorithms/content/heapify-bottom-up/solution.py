def heapify(values):                             # @a entry
    n = len(values)
    for start in range(n // 2 - 1, -1, -1):      # @a start
        root = start                             # @a start
        while True:
            smallest = root                      # @a pick-smallest
            left = 2 * root + 1                  # @a pick-smallest
            right = left + 1                     # @a pick-smallest
            if left < n and values[left] < values[smallest]: smallest = left        # @a compare-left
            if right < n and values[right] < values[smallest]: smallest = right     # @a compare-right
            if smallest == root: break           # @a stop
            values[root], values[smallest] = values[smallest], values[root]   # @a swap
            root = smallest                      # @a swap
    return                                       # @a finish
