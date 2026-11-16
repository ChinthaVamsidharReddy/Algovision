def longest_repeated(s):                                  # @a entry
    root = [0, {}]                                        # @a init
    best = 0                                              # @a init
    for i in range(len(s)):
        node = root                                       # @a suffix
        depth = 0                                         # @a suffix
        for ch in s[i:]:
            if ch not in node[1]:                         # @a check
                node[1][ch] = [0, {}]                     # @a create
            node = node[1][ch]                            # @a descend
            node[0] += 1                                  # @a descend
            depth += 1                                    # @a descend
            if node[0] >= 2 and depth > best:             # @a best
                best = depth                              # @a best
    return best                                           # @a finish
