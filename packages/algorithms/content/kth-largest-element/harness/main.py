import sys

from solution import kth_largest

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
    lines.append(str(kth_largest(values, k)))
print("\n".join(lines))
