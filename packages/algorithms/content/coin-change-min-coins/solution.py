def coin_change(coins, amount):                  # @a entry
    dp = [amount + 1] * (amount + 1)             # @a init-table
    dp[0] = 0                                    # @a init-table
    for a in range(1, amount + 1):               # @a loop
        for coin in coins:                       # @a try-coin
            if coin <= a and dp[a - coin] + 1 < dp[a]:   # @a check
                dp[a] = dp[a - coin] + 1         # @a fill
    return -1 if dp[amount] > amount else dp[amount]   # @a finish
