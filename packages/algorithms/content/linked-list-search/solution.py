class Node:
    def __init__(self, value):
        self.value = value
        self.next = None



def search(head, value):                         # @a entry
    index = 0                                    # @a init-index
    current = head                               # @a init-current
    while current is not None:                   # @a loop
        if current.value == value:               # @a compare
            return index                         # @a found
        current = current.next                   # @a advance
        index += 1                               # @a advance
    return -1                                    # @a not-found
