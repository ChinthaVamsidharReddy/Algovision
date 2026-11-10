def missing(values):                             # @a entry
    n = len(values)
    expected = n * (n + 1) // 2                  # @a init
    total = 0                                    # @a init
    for x in values:                             # @a add
        total += x                               # @a add
    return expected - total                      # @a finish
