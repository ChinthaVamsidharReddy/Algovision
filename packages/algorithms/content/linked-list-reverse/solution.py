class Node:
    def __init__(self, value):
        self.value = value
        self.next = None



def reverse(head):                               # @a entry
    prev = None                                  # @a init-prev
    current = head                               # @a init-current
    while current is not None:                   # @a loop
        next_node = current.next                 # @a save-next
        current.next = prev                      # @a reverse-link
        prev = current                           # @a move-prev
        current = next_node                      # @a move-current
    return prev                                  # @a finish
