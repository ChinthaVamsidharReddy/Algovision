import sys

from solution import power

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    base = take()
    exp = take()
    lines.append(str(power(base, exp)))
print("\n".join(lines))
