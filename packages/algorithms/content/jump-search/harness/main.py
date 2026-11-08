import sys

from solution import jump_search

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
    lines.append(str(jump_search(values, target)))
print("\n".join(lines))
