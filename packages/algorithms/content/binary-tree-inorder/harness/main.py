import sys

from solution import Node, visit

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


def insert(root, v):
    if root is None:
        return Node(v)
    if v < root.value:
        root.left = insert(root.left, v)
    else:
        root.right = insert(root.right, v)
    return root


lines = []
for _ in range(take()):
    root = None
    for _ in range(take()):
        root = insert(root, take())
    out = []
    visit(root, out)
    lines.append(" ".join(str(x) for x in [len(out)] + out))
print("\n".join(lines))
