def trap(values):                                # @a entry
    left, right = 0, len(values) - 1             # @a init
    left_max = right_max = water = 0             # @a init
    while left < right:                          # @a loop
        if values[left] < values[right]:         # @a compare
            if values[left] >= left_max: left_max = values[left]   # @a left-side
            else: water += left_max - values[left]                 # @a left-side
            left += 1                            # @a left-side
        else:
            if values[right] >= right_max: right_max = values[right]   # @a right-side
            else: water += right_max - values[right]                   # @a right-side
            right -= 1                           # @a right-side
    return water                                 # @a finish
