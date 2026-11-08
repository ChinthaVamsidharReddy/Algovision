def search(table, key):                          # @a entry
    size = len(table)
    index = key % size                           # @a compute-hash
    for _ in range(size):                        # @a loop
        if table[index] == -1: return -1         # @a empty-slot
        if table[index] == key: return index     # @a found
        index = (index + 1) % size               # @a probe-next
    return -1                                    # @a not-found
