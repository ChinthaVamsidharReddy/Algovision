def trie_ops(ops):                                        # @a entry
    root = {}                                             # @a init
    answers = 0                                           # @a init
    i = 0
    while i < len(ops):
        code, length = ops[i], ops[i + 1]
        node = root                                       # @a op
        found = True                                      # @a op
        for j in range(length):
            ch = ops[i + 2 + j]
            if ch not in node:                            # @a check
                if code == 1:
                    node[ch] = {}                         # @a create
                else:
                    found = False                         # @a miss
                    break                                 # @a miss
            node = node[ch]                               # @a descend
        if code == 1:
            node["end"] = True                            # @a mark
        elif found:
            if code == 3 or "end" in node:                # @a answer
                answers += 1                              # @a answer
        i += 2 + length
    return answers                                        # @a finish
