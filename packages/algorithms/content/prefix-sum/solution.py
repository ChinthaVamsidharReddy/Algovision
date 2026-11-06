def prefix_sum(values):                          # @a entry
    for i in range(1, len(values)):              # @a loop
        values[i] = values[i - 1] + values[i]    # @a accumulate
    return                                       # @a finish
