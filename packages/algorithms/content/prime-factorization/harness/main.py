import sys

from solution import factorize

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    n = take()
    res = factorize(n)
    lines.append(" ".join(str(x) for x in [len(res)] + list(res)))
print("\n".join(lines))
