def min_path_sum(grid):                          # @a entry
    rows = len(grid)
    cols = len(grid[0])
    for r in range(rows):
        for c in range(cols):
            if r == 0 and c == 0:                # @a start
                continue                         # @a start
            up = grid[r - 1][c] if r > 0 else float("inf")      # @a best
            left = grid[r][c - 1] if c > 0 else float("inf")    # @a best
            grid[r][c] += min(up, left)          # @a add
    return grid[rows - 1][cols - 1]              # @a finish
