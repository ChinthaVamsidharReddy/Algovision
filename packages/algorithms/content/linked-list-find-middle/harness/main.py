import sys

from solution import Node, find_middle

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
    lines.append(str(find_middle(head)))
print("\n".join(lines))
