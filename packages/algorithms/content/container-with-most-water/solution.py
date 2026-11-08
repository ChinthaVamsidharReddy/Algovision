def max_area(height):                            # @a entry
    left, right, best = 0, len(height) - 1, 0    # @a init
    while left < right:                          # @a loop
        h = height[left] if height[left] < height[right] else height[right]   # @a measure
        area = h * (right - left)                # @a area
        if area > best: best = area              # @a update-best
        if height[left] < height[right]:
            left += 1                            # @a move-left
        else:
            right -= 1                           # @a move-right
    return best                                  # @a finish
