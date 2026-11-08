def fib(n):                                      # @a entry
    if n <= 1: return n                          # @a base-case
    dp = [0] * (n + 1)                           # @a init-table
    dp[1] = 1                                    # @a init-table
    for i in range(2, n + 1):                    # @a loop
        dp[i] = dp[i - 1] + dp[i - 2]            # @a fill
    return dp[n]                                 # @a finish
