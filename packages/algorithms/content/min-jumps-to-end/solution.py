def min_jumps(values):                           # @a entry
    n = len(values)
    if n <= 1: return 0                          # @a single
    jumps = cur_end = farthest = 0               # @a init
    for i in range(n - 1):                       # @a loop
        farthest = max(farthest, i + values[i])  # @a extend
        if i == cur_end:                         # @a boundary
            jumps += 1                           # @a jump
            cur_end = farthest                   # @a jump
            if cur_end >= n - 1: return jumps    # @a finish
    return -1                                    # @a unreachable
