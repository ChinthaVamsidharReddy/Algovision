class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None


def visit(node, out):             # @a entry
    if node is None:              # @a base-case
        return                    # @a base-case
    out.append(node.value)        # @a visit
    visit(node.left, out)         # @a go-left
    visit(node.right, out)        # @a go-right
    return                        # @a finish
