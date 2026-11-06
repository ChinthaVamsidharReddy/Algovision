import sys

from solution import LinkedList, Node

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


lines = []
for _ in range(take()):
    n = take()
    lst = LinkedList()
    tail = None
    for _ in range(n):
        node = Node(take())
        if tail is None:
            lst.head = node
        else:
            tail.next = node
        tail = node
    lst.insert_at_head(take())
    out = []
    p = lst.head
    while p is not None:
        out.append(p.value)
        p = p.next
    lines.append(" ".join(str(x) for x in [len(out)] + out))
print("\n".join(lines))
