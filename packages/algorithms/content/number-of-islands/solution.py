def count_islands(grid):                      # @a entry
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    seen = [[False] * cols for _ in range(rows)]
    islands = 0                                     # @a init
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1 and not seen[r][c]:   # @a scan
                islands += 1                         # @a new-island
                flood(grid, seen, r, c)              # @a new-island
    return islands                                  # @a finish


def flood(grid, seen, r, c):
    seen[r][c] = True                            # @a visit
    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nr, nc = r + dr, c + dc                  # @a check
        if 0 <= nr < len(grid) and 0 <= nc < len(grid[0]) and grid[nr][nc] == 1 and not seen[nr][nc]:   # @a check
            flood(grid, seen, nr, nc)            # @a spread
