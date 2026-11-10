import sys

from solution import count_parentheses

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    n = take()
    lines.append(str(count_parentheses(n)))
print("\n".join(lines))
