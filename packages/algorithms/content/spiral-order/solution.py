def spiral_order(grid):                          # @a entry
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    out = []
    top, bottom, left, right = 0, rows - 1, 0, cols - 1   # @a init
    while top <= bottom and left <= right:       # @a layer
        for c in range(left, right + 1):         # @a top
            out.append(grid[top][c])             # @a top
        top += 1                                 # @a top
        for r in range(top, bottom + 1):         # @a right
            out.append(grid[r][right])           # @a right
        right -= 1                               # @a right
        if top <= bottom:                        # @a bottom
            for c in range(right, left - 1, -1): # @a bottom
                out.append(grid[bottom][c])      # @a bottom
            bottom -= 1                          # @a bottom
        if left <= right:                        # @a left
            for r in range(bottom, top - 1, -1): # @a left
                out.append(grid[r][left])        # @a left
            left += 1                            # @a left
    return out                                   # @a finish
