import sys

from solution import fenwick_prefix_sum

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    values = [take() for _ in range(take())]
    index = take()
    lines.append(str(fenwick_prefix_sum(values, index)))
print("\n".join(lines))
