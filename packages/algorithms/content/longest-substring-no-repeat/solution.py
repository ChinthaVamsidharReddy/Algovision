def longest_no_repeat(s):                        # @a entry
    last = [-1] * 26                             # @a init
    left = 0                                     # @a init
    best = 0                                     # @a init
    for right in range(len(s)):                  # @a loop
        c = ord(s[right]) - 97                   # @a loop
        if last[c] >= left:                      # @a shrink
            left = last[c] + 1                   # @a shrink
        last[c] = right                          # @a extend
        best = max(best, right - left + 1)       # @a extend
    return best                                  # @a finish
