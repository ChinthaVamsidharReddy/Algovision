def longest_palindrome(s):                  # @a entry
    n = len(s)
    best = 0                                      # @a init
    for c in range(2 * n - 1):                   # @a centre
        left = c // 2                            # @a centre
        right = left + c % 2                     # @a centre
        while left >= 0 and right < n and s[left] == s[right]:   # @a expand
            best = max(best, right - left + 1)   # @a expand
            left -= 1                            # @a expand
            right += 1                           # @a expand
        # this centre is finished                # @a stop
    return best                                   # @a finish
