class Node:
    def __init__(self, value):
        self.value = value
        self.height = 1
        self.left = None
        self.right = None


def height(node):
    return node.height if node else 0


def update(node):
    node.height = 1 + max(height(node.left), height(node.right))


def rotate_right(y):                             # @a rotate-right
    x = y.left                                   # @a rotate-right
    y.left = x.right                             # @a rotate-right
    x.right = y                                  # @a rotate-right
    update(y)                                    # @a rotate-right
    update(x)                                    # @a rotate-right
    return x                                     # @a rotate-right


def rotate_left(x):                              # @a rotate-left
    y = x.right                                  # @a rotate-left
    x.right = y.left                             # @a rotate-left
    y.left = x                                   # @a rotate-left
    update(x)                                    # @a rotate-left
    update(y)                                    # @a rotate-left
    return y                                     # @a rotate-left


def insert(node, value):                         # @a insert
    if node is None:
        return Node(value)                       # @a create
    if value == node.value:
        return node                              # @a duplicate
    if value < node.value:                       # @a compare
        node.left = insert(node.left, value)     # @a go-left
    else:
        node.right = insert(node.right, value)   # @a go-right
    update(node)                                 # @a balance
    balance = height(node.left) - height(node.right)   # @a balance
    if balance > 1 and value < node.left.value: return rotate_right(node)     # @a rotate-right
    if balance < -1 and value > node.right.value: return rotate_left(node)    # @a rotate-left
    if balance > 1:                              # @a rotate-left
        node.left = rotate_left(node.left)       # @a rotate-left
        return rotate_right(node)                # @a rotate-right
    if balance < -1:                             # @a rotate-right
        node.right = rotate_right(node.right)    # @a rotate-right
        return rotate_left(node)                 # @a rotate-left
    return node                                  # @a balanced


def avl_tree_height(values):                     # @a entry
    root = None
    for v in values:
        root = insert(root, v)                   # @a next
    return height(root)                          # @a finish
