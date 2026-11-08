def three_sum_count(values):                     # @a entry
    n = len(values)
    count = 0                                    # @a init-count
    for i in range(n - 2):                       # @a outer
        if i > 0 and values[i] == values[i - 1]: continue   # @a skip-dup-i
        left = i + 1                             # @a init-pointers
        right = n - 1                            # @a init-pointers
        while left < right:                      # @a loop
            total = values[i] + values[left] + values[right]   # @a sum
            if total == 0:                       # @a check-zero
                count += 1                       # @a found
                left += 1                        # @a found
                right -= 1                       # @a found
                while left < right and values[left] == values[left - 1]: left += 1   # @a skip-dup
            elif total < 0:                      # @a check-neg
                left += 1                        # @a move-left
            else:
                right -= 1                       # @a move-right
    return count                                 # @a finish
