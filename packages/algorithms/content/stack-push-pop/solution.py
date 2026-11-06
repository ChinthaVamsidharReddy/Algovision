def stack_run(values, pops):      # @a entry
    stack = []
    for v in values:
        stack.append(v)           # @a push
    for _ in range(pops):
        if not stack:             # @a check-empty
            break                 # @a underflow
        stack.pop()               # @a pop
    return stack                  # @a finish
