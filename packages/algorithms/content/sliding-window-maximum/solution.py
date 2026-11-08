def max_sliding_window(values, k):               # @a entry
    n = len(values)
    result = []
    dq = []                                      # indices, front at dq[head]
    head = 0
    for i in range(n):                           # @a loop
        while len(dq) > head and values[dq[-1]] <= values[i]:   # @a pop-back
            dq.pop()                             # @a pop-back
        dq.append(i)                             # @a push-back
        if dq[head] <= i - k: head += 1          # @a pop-front
        if i >= k - 1:                           # @a record
            result.append(values[dq[head]])      # @a record
    return result                                # @a finish
