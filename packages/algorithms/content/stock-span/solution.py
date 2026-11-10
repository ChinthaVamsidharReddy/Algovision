def span(values):                                # @a entry
    result = []
    stack = []
    for i in range(len(values)):                 # @a loop
        while stack and values[stack[-1]] <= values[i]:   # @a while-check
            stack.pop()                          # @a pop
        result.append(i + 1 if not stack else i - stack[-1])   # @a compute
        stack.append(i)                          # @a push
    return result                                # @a finish
