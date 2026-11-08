def kadane(values):                              # @a entry
    current = values[0]                          # @a init
    best = values[0]                             # @a init
    for i in range(1, len(values)):              # @a loop
        if current < 0:                          # @a decide
            current = values[i]                  # @a restart
        else:
            current += values[i]                 # @a extend
        if current > best: best = current        # @a update-best
    return best                                  # @a finish
