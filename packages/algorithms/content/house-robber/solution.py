def rob(values):                                 # @a entry
    n = len(values)
    if n == 0: return 0                          # @a base-case
    dp = [0] * (n + 1)                           # @a init-table
    dp[1] = values[0]                            # @a init-table
    for i in range(2, n + 1):                    # @a loop
        take = dp[i - 2] + values[i - 1]         # @a take
        skip = dp[i - 1]                         # @a skip
        dp[i] = max(take, skip)                  # @a fill
    return dp[n]                                 # @a finish
