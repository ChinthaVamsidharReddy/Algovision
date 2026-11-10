def min_cost(values):                            # @a entry
    n = len(values)
    dp = list(values)                            # @a init
    for i in range(2, n):                        # @a fill
        dp[i] = values[i] + min(dp[i - 1], dp[i - 2])   # @a fill
    return min(dp[n - 1], dp[n - 2])             # @a finish
