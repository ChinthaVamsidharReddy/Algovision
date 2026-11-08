import sys

from solution import factorial

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    n = take()
    lines.append(str(factorial(n)))
print("\n".join(lines))
