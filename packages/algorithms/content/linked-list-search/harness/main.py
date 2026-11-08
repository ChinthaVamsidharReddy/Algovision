import sys

from solution import Node, search

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    head = None
    tail = None
    for _ in range(take()):
        node = Node(take())
        if tail is None:
            head = node
        else:
            tail.next = node
        tail = node
    value = take()
    lines.append(str(search(head, value)))
print("\n".join(lines))
