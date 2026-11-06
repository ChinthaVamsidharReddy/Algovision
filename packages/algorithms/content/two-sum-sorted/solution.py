def two_sum_sorted(values, target):              # @a entry
    left = 0                                     # @a init-left
    right = len(values) - 1                      # @a init-right
    while left < right:                          # @a loop
        total = values[left] + values[right]     # @a sum
        if total == target:                      # @a check-equal
            return [left, right]                 # @a found
        elif total < target:                     # @a check-less
            left += 1                            # @a move-left
        else:
            right -= 1                           # @a move-right
    return []                                    # @a not-found
