class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None



def count_leaves(node):                          # @a entry
    if node is None: return 0                    # @a base-case
    if node.left is None and node.right is None: return 1   # @a check-leaf
    left = count_leaves(node.left)               # @a go-left
    right = count_leaves(node.right)             # @a go-right
    return left + right                          # @a combine
