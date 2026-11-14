def max_area(grid):                      # @a entry
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    seen = [[False] * cols for _ in range(rows)]
    best = 0                                     # @a init
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1 and not seen[r][c]:   # @a scan
                size = area(grid, seen, r, c)        # @a record
                best = max(best, size)               # @a record
    return best                                  # @a finish


def area(grid, seen, r, c):
    seen[r][c] = True                            # @a visit
    size = 1                                     # @a visit
    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nr, nc = r + dr, c + dc                  # @a check
        if 0 <= nr < len(grid) and 0 <= nc < len(grid[0]) and grid[nr][nc] == 1 and not seen[nr][nc]:   # @a check
            size += area(grid, seen, nr, nc)     # @a spread
    return size
