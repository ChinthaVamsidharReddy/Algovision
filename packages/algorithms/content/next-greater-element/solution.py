def next_greater(values):                        # @a entry
    n = len(values)
    result = [-1] * n                            # @a init-result
    stack = []
    for i in range(n):                           # @a loop
        while stack and values[stack[-1]] < values[i]:   # @a while-check
            result[stack.pop()] = values[i]      # @a pop-assign
        stack.append(i)                          # @a push
    return result                                # @a finish
