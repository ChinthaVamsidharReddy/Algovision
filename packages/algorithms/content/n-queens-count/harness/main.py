import sys

from solution import count_queens

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    n = take()
    lines.append(str(count_queens(n)))
print("\n".join(lines))
