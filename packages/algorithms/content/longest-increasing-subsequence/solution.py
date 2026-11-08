def lis(values):                                 # @a entry
    n = len(values)
    if n == 0: return 0                          # @a base-case
    dp = [1] * n                                 # @a init-table
    best = 1
    for i in range(1, n):                        # @a loop
        for j in range(i):                       # @a inner-loop
            if values[j] < values[i] and dp[j] + 1 > dp[i]:   # @a check
                dp[i] = dp[j] + 1                # @a fill
        if dp[i] > best: best = dp[i]            # @a update-best
    return best                                  # @a finish
