import sys

from solution import components

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
    lines.append(str(components(values, vertices)))
print("\n".join(lines))
