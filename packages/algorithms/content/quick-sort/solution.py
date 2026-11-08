def quick_sort(values, lo, hi):                  # @a entry
    if lo >= hi:                                 # @a base-case
        return                                   # @a base-case
    pivot = values[hi]                           # @a choose-pivot
    i = lo                                       # @a init-i
    for j in range(lo, hi):                      # @a scan
        if values[j] < pivot:                    # @a compare
            tmp = values[i]                      # @a swap
            values[i] = values[j]                # @a swap
            values[j] = tmp                      # @a swap
            i += 1                               # @a advance
    tmp = values[i]                              # @a place-pivot
    values[i] = values[hi]                       # @a place-pivot
    values[hi] = tmp                             # @a place-pivot
    quick_sort(values, lo, i - 1)                # @a recurse-left
    quick_sort(values, i + 1, hi)                # @a recurse-right
    return                                       # @a finish
