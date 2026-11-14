from collections import deque


def rotting_minutes(grid):                       # @a entry
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    queue = deque()
    fresh = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:                  # @a init
                queue.append((r, c))             # @a init
            elif grid[r][c] == 1:                # @a init
                fresh += 1                       # @a init
    minutes = 0
    while queue and fresh > 0:                   # @a round
        minutes += 1                             # @a round
        for _ in range(len(queue)):
            r, c = queue.popleft()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc          # @a check
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:   # @a check
                    grid[nr][nc] = 2             # @a rot
                    fresh -= 1                   # @a rot
                    queue.append((nr, nc))       # @a rot
    return minutes if fresh == 0 else -1         # @a finish
