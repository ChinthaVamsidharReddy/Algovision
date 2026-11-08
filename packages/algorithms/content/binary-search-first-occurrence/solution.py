def first_occurrence(values, target):            # @a entry
    low = 0                                      # @a init-low
    high = len(values) - 1                       # @a init-high
    result = -1                                  # @a init-result
    while low <= high:                           # @a loop
        mid = low + (high - low) // 2            # @a mid
        if values[mid] == target:                # @a check-equal
            result = mid                         # @a record
            high = mid - 1                       # @a go-left-eq
        elif values[mid] < target:               # @a check-less
            low = mid + 1                        # @a go-right
        else:
            high = mid - 1                       # @a go-left
    return result                                # @a finish
