def max_profit(values):                          # @a entry
    low = values[0]                              # @a init
    best = 0                                     # @a init
    for i in range(1, len(values)):              # @a loop
        if values[i] < low:                      # @a new-min
            low = values[i]                      # @a new-min
        else:
            best = max(best, values[i] - low)    # @a profit
    return best                                  # @a finish
