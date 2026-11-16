import sys

from solution import longest_repeated

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    s = "".join(chr(take()) for _ in range(take()))
    lines.append(str(longest_repeated(s)))
print("\n".join(lines))
