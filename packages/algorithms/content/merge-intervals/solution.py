def merge(values):                               # @a entry
    n = len(values)
    if n == 0: return []                         # @a empty-check
    out = []
    start = values[0]                            # @a init
    end = values[1]                              # @a init
    for i in range(2, n, 2):                     # @a loop
        if values[i] <= end:                     # @a overlap
            end = max(end, values[i + 1])        # @a merge
        else:
            out += [start, end]                  # @a flush
            start = values[i]                    # @a flush
            end = values[i + 1]                  # @a flush
    out += [start, end]                          # @a finish
    return out                                   # @a finish
