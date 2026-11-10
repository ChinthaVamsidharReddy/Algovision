def single(values):                              # @a entry
    result = 0                                   # @a init
    for x in values:                             # @a xor
        result ^= x                              # @a xor
    return result                                # @a finish
