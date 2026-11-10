def count_bits(n):                               # @a entry
    count = 0                                    # @a init
    while n != 0:                                # @a loop
        n &= n - 1                               # @a clear
        count += 1                               # @a clear
    return count                                 # @a finish
