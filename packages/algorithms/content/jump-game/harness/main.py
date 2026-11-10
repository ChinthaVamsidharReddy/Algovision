import sys

from solution import can_jump

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    values = [take() for _ in range(take())]
    lines.append(str(can_jump(values)))
print("\n".join(lines))
