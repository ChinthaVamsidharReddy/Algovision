def selection_sort(values):                      # @a entry
    for i in range(len(values) - 1):             # @a outer-loop
        smallest = i                             # @a init-min
        for j in range(i + 1, len(values)):      # @a inner-loop
            if values[j] < values[smallest]:     # @a compare
                smallest = j                     # @a new-min
        temp = values[i]                         # @a swap
        values[i] = values[smallest]             # @a swap
        values[smallest] = temp                  # @a swap
    return                                       # @a finish
