def ways(values, amount):                        # @a entry
    dp = [0] * (amount + 1)
    dp[0] = 1                                    # @a init
    for coin in values:                          # @a coin-loop
        for a in range(coin, amount + 1):        # @a fill
            dp[a] += dp[a - coin]                # @a fill
    return dp[amount]                            # @a finish
