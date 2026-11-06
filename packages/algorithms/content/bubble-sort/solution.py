def bubble_sort(values):                         # @a entry
    for end in range(len(values) - 1, 0, -1):    # @a outer-loop
        for j in range(end):                     # @a inner-loop
            if values[j] > values[j + 1]:        # @a compare
                temp = values[j]                 # @a swap
                values[j] = values[j + 1]        # @a swap
                values[j + 1] = temp             # @a swap
    return                                       # @a finish
