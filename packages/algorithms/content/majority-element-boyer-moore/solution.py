def majority(values):                            # @a entry
    candidate = 0                                # @a init
    count = 0                                    # @a init
    for x in values:                             # @a loop
        if count == 0: candidate = x             # @a new-candidate
        count += 1 if x == candidate else -1     # @a vote
    return candidate                             # @a finish
