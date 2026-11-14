# Runs inside the practice page's Python worker (Pyodide) before any learner code.
# It provides ListNode and TreeNode, turns test inputs into those structures, and turns results back into plain values.
import json


class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


_AV_LIMIT = 100000


def _av_build_list(values):
    head = None
    for v in reversed(values):
        head = ListNode(v, head)
    return head


def _av_build_tree(values):
    root = None
    for v in values:
        node = TreeNode(v)
        if root is None:
            root = node
            continue
        cur = root
        while True:
            if v < cur.val:
                if cur.left is None:
                    cur.left = node
                    break
                cur = cur.left
            else:
                if cur.right is None:
                    cur.right = node
                    break
                cur = cur.right
    return root


def _av_prepare(adapter, args):
    args = list(args)
    if adapter == "list" and args:
        args[0] = _av_build_list(args[0])
    elif adapter == "tree" and args:
        args[0] = _av_build_tree(args[0])
    return args


def _av_values(adapter, node):
    out = []
    if adapter == "list":
        while node is not None:
            out.append(node.val)
            node = node.next
            if len(out) > _AV_LIMIT:
                raise ValueError("The list you returned is too long or loops back on itself.")
        return out
    stack = []
    while stack or node is not None:
        while node is not None:
            stack.append(node)
            node = node.left
            if len(stack) > _AV_LIMIT:
                raise ValueError("The tree you returned is too deep or loops back on itself.")
        node = stack.pop()
        out.append(node.val)
        node = node.right
        if len(out) > _AV_LIMIT:
            raise ValueError("The tree you returned is too big or loops back on itself.")
    return out


def _av_outcome(adapter, want_list, returned, args):
    if isinstance(returned, bool):
        return int(returned)
    if adapter and want_list and (returned is None or isinstance(returned, (ListNode, TreeNode))):
        return _av_values(adapter, returned)
    if want_list and not adapter and args and isinstance(args[0], list):
        # In-place style: nothing returned means "look at the list you were given"; a number k means "the first k values".
        if returned is None:
            return args[0]
        if isinstance(returned, int) and 0 <= returned <= len(args[0]):
            return args[0][:returned]
    return returned


def _av_define(source, fn_name):
    ns = {"ListNode": ListNode, "TreeNode": TreeNode, "__name__": "__practice__"}
    exec(compile(source, "<your code>", "exec"), ns)
    fn = ns.get(fn_name)
    if not callable(fn):
        raise NameError("Define a function named " + fn_name + " (found nothing with that name).")
    return fn


def _av_call(fn, args_json, adapter, want_list):
    args = _av_prepare(adapter, json.loads(args_json))
    returned = fn(*args)
    try:
        return json.dumps(_av_outcome(adapter, want_list, returned, args))
    except TypeError:
        raise TypeError("Your function returned a " + type(returned).__name__ + ", which cannot be compared. Return an integer or a list of integers.")
