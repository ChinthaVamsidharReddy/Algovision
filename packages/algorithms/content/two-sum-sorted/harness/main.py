import sys

from solution import two_sum_sorted

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    values = [take() for _ in range(take())]
    target = take()
    pair = two_sum_sorted(values, target)
    lines.append(" ".join(str(x) for x in [len(pair)] + pair))
print("\n".join(lines))
