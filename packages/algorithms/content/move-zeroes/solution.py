def move_zeroes(values):                         # @a entry
    write = 0                                    # @a init-write
    for read in range(len(values)):              # @a loop
        if values[read] != 0:                    # @a check-nonzero
            tmp = values[write]                  # @a swap
            values[write] = values[read]         # @a swap
            values[read] = tmp                   # @a swap
            write += 1                           # @a advance-write
    return                                       # @a finish
