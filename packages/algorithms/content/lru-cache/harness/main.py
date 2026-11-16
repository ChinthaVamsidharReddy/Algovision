import sys

from solution import lru_cache

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    values = [take() for _ in range(take())]
    capacity = take()
    lines.append(str(lru_cache(values, capacity)))
print("\n".join(lines))
