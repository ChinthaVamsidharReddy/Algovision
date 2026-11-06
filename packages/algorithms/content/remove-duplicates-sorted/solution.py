def remove_duplicates(values):                   # @a entry
    if len(values) == 0: return 0                # @a check-empty
    slow = 0                                     # @a init-slow
    for fast in range(1, len(values)):           # @a loop
        if values[fast] != values[slow]:         # @a compare
            slow += 1                            # @a advance-slow
            values[slow] = values[fast]          # @a copy
    return slow + 1                              # @a finish
