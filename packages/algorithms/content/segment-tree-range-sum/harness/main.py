import sys

from solution import segment_tree_range_sum

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    values = [take() for _ in range(take())]
    left = take()
    right = take()
    lines.append(str(segment_tree_range_sum(values, left, right)))
print("\n".join(lines))
