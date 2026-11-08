def jump_search(values, target):                 # @a entry
    n = len(values)
    step = 1                                     # @a init-step
    while (step + 1) * (step + 1) <= n: step += 1   # @a init-step
    prev = 0                                     # @a init-prev
    end = step if step < n else n                # @a block-end
    while prev < n and values[end - 1] < target: # @a jump-check
        prev = end                               # @a jump
        end = prev + step if prev + step < n else n   # @a block-end
    for i in range(prev, end):                   # @a linear-loop
        if values[i] == target:                  # @a linear-compare
            return i                             # @a found
    return -1                                    # @a not-found
