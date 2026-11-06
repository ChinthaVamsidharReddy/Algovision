def binary_search(values, target):        # @a entry
    low = 0                               # @a init-low
    high = len(values) - 1                # @a init-high
    while low <= high:                    # @a loop
        mid = low + (high - low) // 2     # @a mid
        if values[mid] == target:         # @a compare
            return mid                    # @a found
        elif values[mid] < target:        # @a check-less
            low = mid + 1                 # @a go-right
        else:
            high = mid - 1                # @a go-left
    return -1                             # @a not-found
