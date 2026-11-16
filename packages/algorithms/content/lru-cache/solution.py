def lru_cache(ops, capacity):                             # @a entry
    slot = [-1] * 1999                                    # @a init
    keys = [0] * capacity                                 # @a init
    vals = [0] * capacity                                 # @a init
    prev = [-1] * capacity                                # @a init
    nxt = [-1] * capacity                                 # @a init
    head = tail = -1                                      # @a init
    size = total = 0                                      # @a init
    i = 0
    while i < len(ops):
        code, n, key = ops[i], ops[i + 1], ops[i + 2]
        s = slot[key + 999]                               # @a lookup
        if code == 2:
            if s == -1:
                total -= 1                                # @a miss
            else:
                total += vals[s]                          # @a hit
        elif s != -1:
            vals[s] = ops[i + 3]                          # @a update
        else:
            if size == capacity:
                s = tail                                  # @a evict
                slot[keys[s] + 999] = -1                  # @a evict
                tail = prev[s]                            # @a evict
                if tail == -1:                            # @a evict
                    head = -1                             # @a evict
                else:                                     # @a evict
                    nxt[tail] = -1                        # @a evict
                prev[s] = -1                              # @a evict
                nxt[s] = -1                               # @a evict
                size -= 1                                 # @a evict
            else:
                s = size                                  # @a insert
            size += 1                                     # @a insert
            keys[s] = key                                 # @a insert
            vals[s] = ops[i + 3]                          # @a insert
            slot[key + 999] = s                           # @a insert
        if s != -1 and s != head:
            if prev[s] != -1:                             # @a front
                nxt[prev[s]] = nxt[s]                     # @a front
            if nxt[s] != -1:                              # @a front
                prev[nxt[s]] = prev[s]                    # @a front
            if tail == s:                                 # @a front
                tail = prev[s]                            # @a front
            prev[s] = -1                                  # @a front
            nxt[s] = head                                 # @a front
            if head != -1:                                # @a front
                prev[head] = s                            # @a front
            head = s                                      # @a front
            if tail == -1:                                # @a front
                tail = s                                  # @a front
        i += 2 + n
    return total                                          # @a finish
