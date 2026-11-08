def sort_colors(values):                         # @a entry
    low, mid, high = 0, 0, len(values) - 1       # @a init
    while mid <= high:                           # @a loop
        if values[mid] == 0:                     # @a check-zero
            tmp = values[low]                    # @a zero-swap
            values[low] = values[mid]            # @a zero-swap
            values[mid] = tmp                    # @a zero-swap
            low += 1                             # @a zero-swap
            mid += 1                             # @a zero-swap
        elif values[mid] == 1:                   # @a check-one
            mid += 1                             # @a one-advance
        else:
            tmp = values[mid]                    # @a two-swap
            values[mid] = values[high]           # @a two-swap
            values[high] = tmp                   # @a two-swap
            high -= 1                            # @a two-swap
    return                                       # @a finish
