def decode(values):                              # @a entry
    n = len(values)
    dp = [0] * (n + 1)
    dp[0] = 1                                    # @a init
    dp[1] = 1 if values[0] != 0 else 0           # @a init
    for i in range(2, n + 1):                    # @a fill
        one = values[i - 1]
        two = values[i - 2] * 10 + values[i - 1]
        if one != 0: dp[i] += dp[i - 1]          # @a fill
        if 10 <= two <= 26: dp[i] += dp[i - 2]   # @a fill
    return dp[n]                                 # @a finish
