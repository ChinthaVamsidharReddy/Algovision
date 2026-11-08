import sys

from solution import has_cycle

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    values = [take() for _ in range(take())]
    vertices = take()
    lines.append(str(has_cycle(values, vertices)))
print("\n".join(lines))
