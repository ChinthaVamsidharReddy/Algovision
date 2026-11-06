class Node:
    def __init__(self, value):
        self.value = value
        self.next = None


class LinkedList:
    def __init__(self):
        self.head = None

    def insert_at_tail(self, value):      # @a entry
        node = Node(value)                # @a create-node
        if self.head is None:             # @a check-empty
            self.head = node              # @a set-head
        else:
            current = self.head           # @a init-current
            while current.next:           # @a loop
                current = current.next    # @a advance
            current.next = node           # @a link-tail
        return                            # @a finish
