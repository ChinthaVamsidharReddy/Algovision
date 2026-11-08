import sys

from solution import bfs

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
    start = take()
    res = bfs(values, vertices, start)
    lines.append(" ".join(str(x) for x in [len(res)] + list(res)))
print("\n".join(lines))
