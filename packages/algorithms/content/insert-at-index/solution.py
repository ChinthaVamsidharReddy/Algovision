def insert_at(values, n, index, value):          # @a entry
    for i in range(n, index, -1):                # @a shift-loop
        values[i] = values[i - 1]                # @a shift
    values[index] = value                        # @a place
    return                                       # @a finish
