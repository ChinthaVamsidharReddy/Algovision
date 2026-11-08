def longest_ones(values, k):                     # @a entry
    left, zeros, best = 0, 0, 0                  # @a init
    for right in range(len(values)):             # @a expand
        if values[right] == 0: zeros += 1        # @a count-zero
        while zeros > k:                         # @a shrink-check
            if values[left] == 0: zeros -= 1     # @a drop
            left += 1                            # @a drop
        length = right - left + 1                # @a measure
        if length > best: best = length          # @a update-best
    return best                                  # @a finish
