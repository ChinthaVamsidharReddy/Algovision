def find_maximum(values):                        # @a entry
    best = values[0]                             # @a init-max
    for i in range(1, len(values)):              # @a loop
        if values[i] > best:                     # @a compare
            best = values[i]                     # @a update
    return best                                  # @a finish
