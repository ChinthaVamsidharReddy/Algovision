class Node:
    def __init__(self, value):
        self.value = value
        self.next = None


class LinkedList:
    def __init__(self):
        self.head = None

    def insert_at_head(self, value):  # @a entry
        node = Node(value)            # @a create-node
        node.next = self.head         # @a link-next
        self.head = node              # @a move-head
        return                        # @a finish
