class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None



def search(root, value):                         # @a entry
    current = root                               # @a init
    while current is not None:                   # @a loop
        if value == current.value: return 1      # @a found
        if value < current.value:
            current = current.left               # @a go-left
        else:
            current = current.right              # @a go-right
    return 0                                     # @a not-found
