def hanoi(n):                                    # @a entry
    if n == 0: return 0                          # @a base-case
    first = hanoi(n - 1)                         # @a recurse-first
    second = hanoi(n - 1)                        # @a recurse-second
    return first + 1 + second                    # @a move-disk
