def reverse(values, lo, hi):
    while lo < hi:                               # @a rev-loop
        tmp = values[lo]                         # @a rev-swap
        values[lo] = values[hi]                  # @a rev-swap
        values[hi] = tmp                         # @a rev-swap
        lo += 1                                  # @a rev-move
        hi -= 1                                  # @a rev-move


def rotate(values, k):                           # @a entry
    n = len(values)
    if n == 0: return                            # @a empty-check
    k = k % n                                    # @a normalize
    reverse(values, 0, k - 1)                    # @a rev-first
    reverse(values, k, n - 1)                    # @a rev-second
    reverse(values, 0, n - 1)                    # @a rev-all
    return                                       # @a finish
