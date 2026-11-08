import sys

from solution import rotate

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    values = [take() for _ in range(take())]
    k = take()
    rotate(values, k)
    lines.append(" ".join(str(x) for x in [len(values)] + values))
print("\n".join(lines))
