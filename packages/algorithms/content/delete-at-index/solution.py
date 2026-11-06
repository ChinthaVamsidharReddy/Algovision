def delete_at(values, n, index):                 # @a entry
    for i in range(index, n - 1):                # @a shift-loop
        values[i] = values[i + 1]                # @a shift
    return                                       # @a finish
