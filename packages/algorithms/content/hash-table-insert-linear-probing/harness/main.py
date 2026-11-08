import sys

from solution import insert_all

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    values = [take() for _ in range(take())]
    size = take()
    res = insert_all(values, size)
    lines.append(" ".join(str(x) for x in [len(res)] + list(res)))
print("\n".join(lines))
