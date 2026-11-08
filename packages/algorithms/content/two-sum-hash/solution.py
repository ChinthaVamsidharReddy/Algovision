def two_sum(values, target):                     # @a entry
    seen = {}                                    # @a init-map
    for j in range(len(values)):                 # @a loop
        need = target - values[j]                # @a compute-complement
        if need in seen:                         # @a check-seen
            return [seen[need], j]               # @a found
        seen[values[j]] = j                      # @a store
    return []                                    # @a not-found
