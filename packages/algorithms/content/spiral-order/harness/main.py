import sys

from solution import spiral_order

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    rows = take()
    cols = take()
    grid = [[take() for _ in range(cols)] for _ in range(rows)]
    res = spiral_order(grid)
    lines.append(" ".join(str(x) for x in [len(res)] + list(res)))
print("\n".join(lines))
