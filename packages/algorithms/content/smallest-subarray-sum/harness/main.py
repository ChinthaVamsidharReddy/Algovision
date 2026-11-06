import sys

from solution import min_subarray_len

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    values = [take() for _ in range(take())]
    target = take()
    lines.append(str(min_subarray_len(values, target)))
print("\n".join(lines))
