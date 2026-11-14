import sys

from solution import rotting_minutes

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
    lines.append(str(rotting_minutes(grid)))
print("\n".join(lines))
