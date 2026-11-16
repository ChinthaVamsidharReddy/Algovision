def count_distinct(s):                                    # @a entry
    root = {}                                             # @a init
    count = 0                                             # @a init
    for i in range(len(s)):
        node = root                                       # @a suffix
        for ch in s[i:]:
            if ch not in node:                            # @a check
                node[ch] = {}                             # @a create
                count += 1                                # @a create
            node = node[ch]                               # @a descend
    return count                                          # @a finish
