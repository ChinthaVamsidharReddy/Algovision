# Practice-page reference solutions for the algorithms whose reference code is written around helpers (a node class, array bounds,
# a prebuilt table), so the practice page asks for a different function. They use the ListNode / TreeNode classes that the page
# provides. Used by the vector test (vitest) and by the browser end-to-end check, so keep it plain Python with no imports.


# ---- plain arrays
def delete_at_index(values, index):
    return values[:index] + values[index + 1:]


def insert_at_index(values, index, value):
    return values[:index] + [value] + values[index:]


def hash_table_search(values, size, key):
    table = [-1] * size
    for k in values:
        i = k % size
        for _ in range(size):
            if table[i] == -1:
                table[i] = k
                break
            i = (i + 1) % size
    i = key % size
    for _ in range(size):
        if table[i] == key:
            return i
        i = (i + 1) % size
    return -1


def merge_sort(values):
    return sorted(values)


def quick_sort(values):
    return sorted(values)


def remove_duplicates(values):
    out = []
    for v in values:
        if not out or out[-1] != v:
            out.append(v)
    return out


# ---- linked lists (head is a ListNode or None)
def insert_at_head(head, value):
    node = ListNode(value)
    node.next = head
    return node


def insert_at_tail(head, value):
    node = ListNode(value)
    if head is None:
        return node
    cur = head
    while cur.next is not None:
        cur = cur.next
    cur.next = node
    return head


def insert_at_position(head, position, value):
    node = ListNode(value)
    if position == 0:
        node.next = head
        return node
    cur = head
    for _ in range(position - 1):
        cur = cur.next
    node.next = cur.next
    cur.next = node
    return head


def delete_value(head, value):
    if head is None:
        return None
    if head.val == value:
        return head.next
    cur = head
    while cur.next is not None and cur.next.val != value:
        cur = cur.next
    if cur.next is not None:
        cur.next = cur.next.next
    return head


def remove_nth_from_end(head, n):
    fast = head
    for _ in range(n):
        fast = fast.next
    if fast is None:
        return head.next
    slow = head
    while fast.next is not None:
        fast = fast.next
        slow = slow.next
    slow.next = slow.next.next
    return head


def reverse_list(head):
    prev = None
    while head is not None:
        nxt = head.next
        head.next = prev
        prev = head
        head = nxt
    return prev


def search_value(head, value):
    i = 0
    while head is not None:
        if head.val == value:
            return i
        head = head.next
        i += 1
    return -1


def find_middle(head):
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
    return slow.val


# ---- binary search trees (root is a TreeNode or None)
def tree_height(root):
    return 0 if root is None else 1 + max(tree_height(root.left), tree_height(root.right))


def count_leaves(root):
    if root is None:
        return 0
    if root.left is None and root.right is None:
        return 1
    return count_leaves(root.left) + count_leaves(root.right)


def bst_search(root, value):
    while root is not None:
        if value == root.val:
            return 1
        root = root.left if value < root.val else root.right
    return 0


def bst_insert(root, value):
    if root is None:
        return TreeNode(value)
    if value < root.val:
        root.left = bst_insert(root.left, value)
    else:
        root.right = bst_insert(root.right, value)
    return root


def inorder_traversal(root):
    return [] if root is None else inorder_traversal(root.left) + [root.val] + inorder_traversal(root.right)


def preorder_traversal(root):
    return [] if root is None else [root.val] + preorder_traversal(root.left) + preorder_traversal(root.right)


def postorder_traversal(root):
    return [] if root is None else postorder_traversal(root.left) + postorder_traversal(root.right) + [root.val]


def level_order_traversal(root):
    out = []
    queue = [root] if root is not None else []
    while queue:
        node = queue.pop(0)
        out.append(node.val)
        for child in (node.left, node.right):
            if child is not None:
                queue.append(child)
    return out


def find_min_max(root):
    low = high = root
    while low.left is not None:
        low = low.left
    while high.right is not None:
        high = high.right
    return [low.val, high.val]
