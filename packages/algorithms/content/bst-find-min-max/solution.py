class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None



def find_min_max(root, out):                     # @a entry
    current = root                               # @a init-min
    while current.left is not None:              # @a loop-min
        current = current.left                   # @a go-left
    out.append(current.value)                    # @a record-min
    current = root                               # @a init-max
    while current.right is not None:             # @a loop-max
        current = current.right                  # @a go-right
    out.append(current.value)                    # @a record-max
    return                                       # @a finish
