import sys

from solution import longest_ones

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
    lines.append(str(longest_ones(values, k)))
print("\n".join(lines))
