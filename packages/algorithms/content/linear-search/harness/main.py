import sys

from solution import linear_search

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    values = [take() for _ in range(take())]
    lines.append(str(linear_search(values, take())))
print("\n".join(lines))
