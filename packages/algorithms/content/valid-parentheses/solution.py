def is_valid(values):                            # @a entry
    stack = []
    for c in values:                             # @a loop
        if c % 2 == 1:                           # @a check-open
            stack.append(c)                      # @a push
            continue
        if not stack: return 0                   # @a check-empty
        if stack[-1] != c - 1: return 0          # @a check-match
        stack.pop()                              # @a pop
    return 1 if not stack else 0                 # @a finish
