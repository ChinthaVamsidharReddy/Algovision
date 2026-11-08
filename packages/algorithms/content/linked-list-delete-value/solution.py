class Node:
    def __init__(self, value):
        self.value = value
        self.next = None



def delete_value(head, value):                   # @a entry
    if head is None: return None                 # @a check-empty
    if head.value == value:                      # @a check-head
        return head.next                         # @a delete-head
    prev = head                                  # @a init-prev
    while prev.next is not None and prev.next.value != value:   # @a loop
        prev = prev.next                         # @a advance
    if prev.next is not None:                    # @a check-found
        prev.next = prev.next.next               # @a unlink
    return head                                  # @a finish
