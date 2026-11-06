import sys

from solution import stack_run

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    values = [take() for _ in range(take())]
    result = stack_run(values, take())
    lines.append(" ".join(str(x) for x in [len(result)] + result))
print("\n".join(lines))
