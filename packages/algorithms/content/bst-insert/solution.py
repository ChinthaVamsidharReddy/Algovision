class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None



def insert(root, value):                         # @a entry
    created = Node(value)                        # @a create-node
    if root is None: return created              # @a check-empty
    current = root
    while True:
        if value < current.value:                # @a compare
            if current.left is None:             # @a attach-left
                current.left = created           # @a attach-left
                return root                      # @a finish
            current = current.left               # @a go-left
        else:
            if current.right is None:            # @a attach-right
                current.right = created          # @a attach-right
                return root                      # @a finish
            current = current.right              # @a go-right
