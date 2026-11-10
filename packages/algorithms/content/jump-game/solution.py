def can_jump(values):                            # @a entry
    reach = 0                                    # @a init
    for i in range(len(values)):                 # @a loop
        if i > reach: return 0                   # @a stuck
        reach = max(reach, i + values[i])        # @a extend
    return 1                                     # @a finish
