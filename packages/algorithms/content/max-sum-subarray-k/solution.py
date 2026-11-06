def max_sum_subarray(values, k):                 # @a entry
    window_sum = 0                               # @a init-sum
    for i in range(k):                           # @a first-window
        window_sum += values[i]                  # @a first-window
    best = window_sum                            # @a init-best
    for right in range(k, len(values)):          # @a slide
        window_sum += values[right] - values[right - k]  # @a update-sum
        if window_sum > best:                    # @a compare
            best = window_sum                    # @a new-best
    return best                                  # @a finish
