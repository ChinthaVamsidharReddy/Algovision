import sys

from solution import lower_bound

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
    lines.append(str(lower_bound(values, target)))
print("\n".join(lines))
