def counting_sort(values):                       # @a entry
    counts = [0] * 21                            # @a init-counts
    for i in range(len(values)):                 # @a count
        counts[values[i]] += 1                   # @a count
    k = 0
    for v in range(21):                          # @a value-loop
        while counts[v] > 0:
            values[k] = v                        # @a write
            k += 1                               # @a write
            counts[v] -= 1                       # @a write
    return                                       # @a finish
