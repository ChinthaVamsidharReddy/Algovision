def rob(values):                                 # @a entry
    n = len(values)
    if n == 1: return values[0]                  # @a single
    a = line(values, 0, n - 2)                   # @a rob-first
    b = line(values, 1, n - 1)                   # @a rob-second
    return max(a, b)                             # @a finish


def line(values, lo, hi):
    prev = cur = 0
    for i in range(lo, hi + 1):                  # @a pick
        nxt = max(cur, prev + values[i])         # @a pick
        prev = cur                               # @a pick
        cur = nxt                                # @a pick
    return cur
