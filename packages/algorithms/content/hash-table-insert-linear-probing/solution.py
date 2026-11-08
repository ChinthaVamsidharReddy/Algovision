def insert_all(keys, size):                      # @a entry
    table = [-1] * size                          # @a init-table
    for key in keys:                             # @a loop
        index = key % size                       # @a compute-hash
        tries = 0
        while table[index] != -1 and tries < size:   # @a probe-check
            index = (index + 1) % size           # @a probe-next
            tries += 1                           # @a probe-next
        if tries == size: continue               # @a table-full
        table[index] = key                       # @a place
    return table                                 # @a finish
