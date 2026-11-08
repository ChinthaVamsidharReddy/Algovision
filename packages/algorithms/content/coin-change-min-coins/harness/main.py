import sys

from solution import coin_change

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    values = [take() for _ in range(take())]
    amount = take()
    lines.append(str(coin_change(values, amount)))
print("\n".join(lines))
