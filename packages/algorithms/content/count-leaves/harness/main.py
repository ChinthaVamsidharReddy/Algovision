import sys

from solution import Node, count_leaves

tokens = sys.stdin.read().split()
pos = 0


def take():
    global pos
    pos += 1
    return int(tokens[pos - 1])


def insert_node(root, v):
    if root is None:
        return Node(v)
    if v < root.value:
        root.left = insert_node(root.left, v)
    else:
        root.right = insert_node(root.right, v)
    return root


def inorder(node, out):
    if node is None:
        return
    inorder(node.left, out)
    out.append(node.value)
    inorder(node.right, out)


lines = []
for _ in range(take()):
    n = take()
    root = None
    for _ in range(n):
        root = insert_node(root, take())
    lines.append(str(count_leaves(root)))
print("\n".join(lines))
