def run(ops, capacity):                          # @a entry
    data = [0] * capacity
    front = 0                                    # @a init
    size = 0                                     # @a init
    for op in ops:                               # @a loop
        if op != 0:                              # @a check-op
            if size == capacity: continue        # @a overflow
            data[(front + size) % capacity] = op # @a enqueue
            size += 1                            # @a enqueue
        else:
            if size == 0: continue               # @a underflow
            data[front] = 0                      # @a dequeue
            front = (front + 1) % capacity       # @a dequeue
            size -= 1                            # @a dequeue
    return [data[(front + i) % capacity] for i in range(size)]   # @a finish
