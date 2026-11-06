import sys

from solution import remove_duplicates

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    values = [take() for _ in range(take())]
    k = remove_duplicates(values)
    lines.append(" ".join(str(x) for x in [len(values[:k])] + values[:k]))
print("\n".join(lines))
