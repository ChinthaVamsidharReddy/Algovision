def longest_replacement(s, k):                   # @a entry
    freq = [0] * 26
    left = 0                                     # @a init
    top = 0                                      # @a init
    best = 0                                     # @a init
    for right in range(len(s)):                  # @a grow
        c = ord(s[right]) - 97                   # @a grow
        freq[c] += 1                             # @a grow
        top = max(top, freq[c])                  # @a grow
        if right - left + 1 - top > k:           # @a shrink
            freq[ord(s[left]) - 97] -= 1         # @a shrink
            left += 1                            # @a shrink
        best = max(best, right - left + 1)       # @a record
    return best                                  # @a finish
