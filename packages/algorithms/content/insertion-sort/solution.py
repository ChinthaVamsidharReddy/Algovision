def insertion_sort(values):                      # @a entry
    for i in range(1, len(values)):              # @a outer-loop
        key = values[i]                          # @a pick-key
        j = i - 1                                # @a pick-key
        while j >= 0 and values[j] > key:        # @a inner-loop
            values[j + 1] = values[j]            # @a shift
            j -= 1                               # @a shift
        values[j + 1] = key                      # @a insert
    return                                       # @a finish
