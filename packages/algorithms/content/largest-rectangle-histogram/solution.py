def largest(values):                             # @a entry
    n = len(values)
    stack = []
    best = 0
    for i in range(n + 1):                       # @a loop
        h = 0 if i == n else values[i]           # @a loop
        while stack and values[stack[-1]] > h:   # @a while-check
            height = values[stack.pop()]         # @a pop-area
            width = i if not stack else i - stack[-1] - 1   # @a pop-area
            best = max(best, height * width)     # @a pop-area
        stack.append(i)                          # @a push
    return best                                  # @a finish
