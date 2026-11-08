def knapsack(items, capacity):                   # @a entry
    dp = [0] * (capacity + 1)                    # @a init-table
    for k in range(0, len(items), 2):            # @a loop
        weight = items[k]
        value = items[k + 1]
        for c in range(capacity, weight - 1, -1):    # @a inner-loop
            if dp[c - weight] + value > dp[c]:   # @a check
                dp[c] = dp[c - weight] + value   # @a fill
    return dp[capacity]                          # @a finish
