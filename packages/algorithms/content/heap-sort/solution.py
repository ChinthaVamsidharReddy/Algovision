def sift_down(values, root, size):               # @a sift-entry
    while True:
        largest = root                           # @a pick-largest
        left = 2 * root + 1                      # @a pick-largest
        right = left + 1                         # @a pick-largest
        if left < size and values[left] > values[largest]: largest = left       # @a compare-left
        if right < size and values[right] > values[largest]: largest = right    # @a compare-right
        if largest == root: return               # @a sift-done
        tmp = values[root]                       # @a sift-swap
        values[root] = values[largest]           # @a sift-swap
        values[largest] = tmp                    # @a sift-swap
        root = largest                           # @a sift-move


def heap_sort(values):                           # @a entry
    n = len(values)
    for start in range(n // 2 - 1, -1, -1):      # @a build-heap
        sift_down(values, start, n)
    for end in range(n - 1, 0, -1):              # @a extract-loop
        tmp = values[0]                          # @a extract-swap
        values[0] = values[end]                  # @a extract-swap
        values[end] = tmp                        # @a extract-swap
        sift_down(values, 0, end)
    return                                       # @a finish
