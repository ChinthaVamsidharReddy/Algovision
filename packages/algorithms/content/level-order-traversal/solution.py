from collections import deque


class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None



def level_order(root, out):                      # @a entry
    if root is None: return
    queue = deque()
    queue.append(root)                           # @a enqueue-root
    while queue:                                 # @a loop
        node = queue.popleft()                   # @a dequeue
        out.append(node.value)                   # @a visit
        if node.left is not None: queue.append(node.left)     # @a enqueue-left
        if node.right is not None: queue.append(node.right)   # @a enqueue-right
    return                                       # @a finish
