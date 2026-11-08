def count_frequencies(values):                   # @a entry
    count = {}                                   # @a init-map
    order = []                                   # @a init-map
    for v in values:                             # @a loop
        if v not in count: order.append(v)       # @a first-seen
        count[v] = count.get(v, 0) + 1           # @a increment
    result = []                                  # @a build-output
    for v in order:                              # @a build-output
        result += [v, count[v]]                  # @a build-output
    return result                                # @a finish
