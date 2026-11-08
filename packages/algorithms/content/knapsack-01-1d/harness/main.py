import sys

from solution import knapsack

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    values = [take() for _ in range(take())]
    capacity = take()
    lines.append(str(knapsack(values, capacity)))
print("\n".join(lines))
