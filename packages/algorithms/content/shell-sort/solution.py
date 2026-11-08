def shell_sort(values):                          # @a entry
    n = len(values)
    gap = n // 2
    while gap > 0:                               # @a gap-loop
        for i in range(gap, n):
            temp = values[i]                     # @a pick
            j = i                                # @a pick
            while j >= gap and values[j - gap] > temp:   # @a compare
                values[j] = values[j - gap]      # @a shift
                j -= gap                         # @a shift
            values[j] = temp                     # @a place
        gap //= 2
    return                                       # @a finish
