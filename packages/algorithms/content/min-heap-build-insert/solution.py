def build_heap_by_insert(values):                # @a entry
    for i in range(1, len(values)):              # @a insert
        child = i                                # @a insert
        while child > 0:                         # @a sift-up
            parent = (child - 1) // 2            # @a sift-up
            if values[parent] <= values[child]:  # @a compare
                break                            # @a stop
            values[parent], values[child] = values[child], values[parent]   # @a swap
            child = parent                       # @a swap
    return                                       # @a finish
