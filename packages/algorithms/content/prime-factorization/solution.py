def factorize(n):                                # @a entry
    out = []
    d = 2                                        # @a init
    while d * d <= n:                            # @a loop
        if n % d == 0:                           # @a check
            out.append(d)                        # @a divide
            n //= d                              # @a divide
        else:
            d += 1                               # @a next
    if n > 1: out.append(n)                      # @a remainder
    return out                                   # @a finish
