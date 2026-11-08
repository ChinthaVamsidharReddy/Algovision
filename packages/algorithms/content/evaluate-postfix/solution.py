def evaluate(values):                            # @a entry
    stack = []
    for t in values:                             # @a loop
        if t >= 0:                               # @a check-operand
            stack.append(t)                      # @a push-operand
            continue
        right = stack.pop()                      # @a pop-right
        left = stack.pop()                       # @a pop-left
        if t == -1: result = left + right        # @a apply
        elif t == -2: result = left - right      # @a apply
        elif t == -3: result = left * right      # @a apply
        else: result = int(left / right)         # @a apply
        stack.append(result)                     # @a push-result
    return stack[0]                              # @a finish
