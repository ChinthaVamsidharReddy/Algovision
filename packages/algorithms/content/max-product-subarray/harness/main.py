import sys

from solution import max_product

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    values = [take() for _ in range(take())]
    lines.append(str(max_product(values)))
print("\n".join(lines))
