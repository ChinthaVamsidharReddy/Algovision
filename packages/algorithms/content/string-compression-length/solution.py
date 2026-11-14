def compressed_length(s):                        # @a entry
    total = 0                                    # @a init
    i = 0
    while i < len(s):
        j = i                                    # @a run
        while j < len(s) and s[j] == s[i]:       # @a run
            j += 1                               # @a run
        run = j - i                              # @a run
        total += 1 + (len(str(run)) if run > 1 else 0)   # @a emit
        i = j                                    # @a emit
    return total                                 # @a finish
