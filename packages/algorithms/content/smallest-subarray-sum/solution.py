def min_subarray_len(values, target):            # @a entry
    left = 0                                     # @a init-left
    total = 0                                    # @a init-sum
    best = 0                                     # @a init-best
    for right in range(len(values)):             # @a expand
        total += values[right]                   # @a add
        while total >= target:                   # @a shrink-check
            length = right - left + 1            # @a measure
            if best == 0 or length < best:       # @a compare
                best = length                    # @a new-best
            total -= values[left]                # @a shrink
            left += 1                            # @a shrink
    return best                                  # @a finish
