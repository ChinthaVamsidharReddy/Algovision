import sys

from solution import insert_at

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    values = [take() for _ in range(take())]
    index = take()
    value = take()
    values.append(0)
    insert_at(values, len(values) - 1, index, value)
    lines.append(" ".join(str(x) for x in [len(values)] + values))
print("\n".join(lines))
