class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None



def height(node):                                # @a entry
    if node is None: return 0                    # @a base-case
    left = height(node.left)                     # @a go-left
    right = height(node.right)                   # @a go-right
    return 1 + max(left, right)                  # @a combine
