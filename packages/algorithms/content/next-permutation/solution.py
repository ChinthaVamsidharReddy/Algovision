def next_permutation(values):                    # @a entry
    n = len(values)
    i = n - 2                                    # @a init
    while i >= 0 and values[i] >= values[i + 1]: # @a find-pivot
        i -= 1                                   # @a find-pivot
    if i >= 0:                                   # @a find-pivot
        j = n - 1                                # @a find-swap
        while values[j] <= values[i]:            # @a find-swap
            j -= 1                               # @a find-swap
        values[i], values[j] = values[j], values[i]   # @a swap
    lo = i + 1                                   # @a reverse-init
    hi = n - 1                                   # @a reverse-init
    while lo < hi:                               # @a reverse
        values[lo], values[hi] = values[hi], values[lo]   # @a reverse
        lo += 1                                  # @a reverse
        hi -= 1                                  # @a reverse
    return                                       # @a finish
