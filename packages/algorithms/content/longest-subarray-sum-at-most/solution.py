def longest_at_most(values, target):             # @a entry
    left, total, best = 0, 0, 0                  # @a init
    for right in range(len(values)):
        total += values[right]                   # @a add
        while total > target:                    # @a shrink-check
            total -= values[left]                # @a shrink
            left += 1                            # @a shrink
        length = right - left + 1                # @a measure
        if length > best: best = length          # @a update-best
    return best                                  # @a finish
