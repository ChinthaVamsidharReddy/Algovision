def count_primes(n):                             # @a entry
    flags = [0] * (n + 1)
    for i in range(2, n + 1):                    # @a init
        flags[i] = 1                             # @a init
    for p in range(2, n + 1):                    # @a loop
        if p * p > n: break                      # @a loop
        if flags[p] == 1:                        # @a check-prime
            for m in range(p * p, n + 1, p):     # @a mark
                flags[m] = 0                     # @a mark
    count = 0
    for i in range(2, n + 1):                    # @a finish
        count += flags[i]                        # @a finish
    return count                                 # @a finish
