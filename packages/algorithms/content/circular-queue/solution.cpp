int run(const int ops[], int n, int capacity, int out[]) {   // @a entry
    std::vector<int> data(capacity, 0);
    int front = 0;                                       // @a init
    int size = 0;                                        // @a init
    for (int k = 0; k < n; k++) {                        // @a loop
        int op = ops[k];
        if (op != 0) {                                   // @a check-op
            if (size == capacity) { continue; }          // @a overflow
            data[(front + size) % capacity] = op;        // @a enqueue
            size++;                                      // @a enqueue
        } else {
            if (size == 0) { continue; }                 // @a underflow
            data[front] = 0;                             // @a dequeue
            front = (front + 1) % capacity;              // @a dequeue
            size--;                                      // @a dequeue
        }
    }
    for (int i = 0; i < size; i++) { out[i] = data[(front + i) % capacity]; }   // @a finish
    return size;                                         // @a finish
}
