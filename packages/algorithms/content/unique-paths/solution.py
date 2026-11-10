def paths(rows, cols):                           # @a entry
    dp = [0] * cols
    for j in range(cols):                        # @a init
        dp[j] = 1                                # @a init
    for i in range(1, rows):                     # @a row
        for j in range(1, cols):                 # @a fill
            dp[j] += dp[j - 1]                   # @a fill
    return dp[cols - 1]                          # @a finish
