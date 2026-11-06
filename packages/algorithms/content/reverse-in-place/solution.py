def reverse_in_place(values):                    # @a entry
    left = 0                                     # @a init-left
    right = len(values) - 1                      # @a init-right
    while left < right:                          # @a loop
        temp = values[left]                      # @a swap
        values[left] = values[right]             # @a swap
        values[right] = temp                     # @a swap
        left += 1                                # @a move
        right -= 1                               # @a move
    return                                       # @a finish
