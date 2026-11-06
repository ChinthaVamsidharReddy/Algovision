def queue_run(values, removes):   # @a entry
    queue = []
    front = 0
    rear = 0
    for v in values:
        queue.append(v)           # @a enqueue
        rear += 1                 # @a enqueue
    for _ in range(removes):
        if front == rear:         # @a check-empty
            break                 # @a underflow
        front += 1                # @a dequeue
    return queue[front:rear]      # @a finish
