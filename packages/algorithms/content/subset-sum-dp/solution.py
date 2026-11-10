def can_make(values, target):                    # @a entry
    dp = [0] * (target + 1)
    dp[0] = 1                                    # @a init
    for v in values:                             # @a item-loop
        for s in range(target, v - 1, -1):       # @a fill
            if dp[s - v] == 1: dp[s] = 1         # @a fill
    return dp[target]                            # @a finish
