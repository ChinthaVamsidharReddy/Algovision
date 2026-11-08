class Node:
    def __init__(self, value):
        self.value = value
        self.next = None



def insert_at(head, position, value):            # @a entry
    node = Node(value)                           # @a create-node
    if position == 0:                            # @a check-head
        node.next = head                         # @a link-new-head
        return node                              # @a link-new-head
    prev = head                                  # @a init-prev
    for _ in range(position - 1):                # @a walk-loop
        prev = prev.next                         # @a advance
    node.next = prev.next                        # @a link-new
    prev.next = node                             # @a link-prev
    return head                                  # @a finish
