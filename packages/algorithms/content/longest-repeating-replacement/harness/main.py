import sys

from solution import longest_replacement

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    s = "".join(chr(take()) for _ in range(take()))
    k = take()
    lines.append(str(longest_replacement(s, k)))
print("\n".join(lines))
