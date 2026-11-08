class Node:
    def __init__(self, value):
        self.value = value
        self.next = None



def remove_nth_from_end(head, n):                # @a entry
    fast = head                                  # @a init-pointers
    slow = head                                  # @a init-pointers
    for _ in range(n):                           # @a gap-loop
        fast = fast.next                         # @a gap-advance
    if fast is None:                             # @a check-head
        return head.next                         # @a remove-head
    while fast.next is not None:                 # @a loop
        fast = fast.next                         # @a move-fast
        slow = slow.next                         # @a move-slow
    slow.next = slow.next.next                   # @a unlink
    return head                                  # @a finish
