def linear_search(values, target):  # @a entry
    for i in range(len(values)):    # @a loop
        if values[i] == target:     # @a compare
            return i                # @a found
    return -1                       # @a not-found
