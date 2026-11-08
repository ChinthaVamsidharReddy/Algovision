import sys

from solution import Node, remove_nth_from_end

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
    n = take()
    head = remove_nth_from_end(head, n)
    out = []
    p = head
    while p is not None:
        out.append(p.value)
        p = p.next
    lines.append(" ".join(str(x) for x in [len(out)] + out))
print("\n".join(lines))
