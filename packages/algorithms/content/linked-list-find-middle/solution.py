class Node:
    def __init__(self, value):
        self.value = value
        self.next = None



def find_middle(head):                           # @a entry
    slow = head                                  # @a init-pointers
    fast = head                                  # @a init-pointers
    while fast is not None and fast.next is not None:   # @a loop
        slow = slow.next                         # @a move-slow
        fast = fast.next.next                    # @a move-fast
    return slow.value                            # @a finish
