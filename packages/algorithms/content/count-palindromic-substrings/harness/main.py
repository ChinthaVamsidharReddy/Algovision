import sys

from solution import count_palindromes

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    s = "".join(chr(take()) for _ in range(take()))
    lines.append(str(count_palindromes(s)))
print("\n".join(lines))
