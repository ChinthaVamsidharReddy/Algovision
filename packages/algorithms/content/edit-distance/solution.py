def edit_distance(s, t):                         # @a entry
    m, n = len(s), len(t)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1): dp[i][0] = i          # @a init
    for j in range(n + 1): dp[0][j] = j          # @a init
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s[i - 1] == t[j - 1]:             # @a compare
                dp[i][j] = dp[i - 1][j - 1]      # @a match
            else:
                dp[i][j] = 1 + min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])   # @a edit
    return dp[m][n]                              # @a finish
