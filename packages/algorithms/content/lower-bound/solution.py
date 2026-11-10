def lower_bound(values, target):                        # @a entry
    low = 0                                      # @a init
    high = len(values)                           # @a init
    while low < high:                            # @a loop
        mid = low + (high - low) // 2            # @a loop
        if values[mid] < target:                  # @a compare
            low = mid + 1                        # @a go-right
        else:
            high = mid                           # @a go-left
    return low                                   # @a finish
