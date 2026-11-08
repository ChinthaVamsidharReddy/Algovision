import sys

from solution import merge_sort

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    values = [take() for _ in range(take())]
    merge_sort(values, [0] * len(values), 0, len(values) - 1)
    lines.append(" ".join(str(x) for x in [len(values)] + values))
print("\n".join(lines))
