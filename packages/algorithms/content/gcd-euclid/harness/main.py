import sys

from solution import gcd

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    a = take()
    b = take()
    lines.append(str(gcd(a, b)))
print("\n".join(lines))
