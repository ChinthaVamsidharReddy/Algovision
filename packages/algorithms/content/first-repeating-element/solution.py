def first_repeating(values):                     # @a entry
    seen = set()                                 # @a init-set
    for v in values:                             # @a loop
        if v in seen:                            # @a check-seen
            return v                             # @a found
        seen.add(v)                              # @a store
    return -1                                    # @a not-found
