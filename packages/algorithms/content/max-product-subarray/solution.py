def max_product(values):                         # @a entry
    hi = lo = best = values[0]                   # @a init
    for i in range(1, len(values)):              # @a loop
        x = values[i]                            # @a loop
        a, b = hi * x, lo * x                    # @a update
        hi = max(x, a, b)                        # @a update
        lo = min(x, a, b)                        # @a update
        if hi > best: best = hi                  # @a best
    return best                                  # @a finish
