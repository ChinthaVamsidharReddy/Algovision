import sys

from solution import search

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


def build(keys, size):
    table = [-1] * size
    for key in keys:
        index = key % size
        tries = 0
        while table[index] != -1 and tries < size:
            index = (index + 1) % size
            tries += 1
        if tries < size:
            table[index] = key
    return table


lines = []
for _ in range(take()):
    keys = [take() for _ in range(take())]
    size = take()
    key = take()
    lines.append(str(search(build(keys, size), key)))
print("\n".join(lines))
