def select(values):                              # @a entry
    count = 0                                    # @a init
    last_end = -1                                # @a init
    for i in range(0, len(values) - 1, 2):       # @a loop
        if values[i] >= last_end:                # @a check
            count += 1                           # @a select
            last_end = values[i + 1]             # @a select
    return count                                 # @a finish
