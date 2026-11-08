class CircularQueue {
    static int[] run(int[] ops, int capacity) {          // @a entry
        int[] data = new int[capacity];
        int front = 0;                                   // @a init
        int size = 0;                                    // @a init
        for (int op : ops) {                             // @a loop
            if (op != 0) {                               // @a check-op
                if (size == capacity) { continue; }      // @a overflow
                data[(front + size) % capacity] = op;    // @a enqueue
                size++;                                  // @a enqueue
            } else {
                if (size == 0) { continue; }             // @a underflow
                data[front] = 0;                         // @a dequeue
                front = (front + 1) % capacity;          // @a dequeue
                size--;                                  // @a dequeue
            }
        }
        int[] out = new int[size];                       // @a finish
        for (int i = 0; i < size; i++) { out[i] = data[(front + i) % capacity]; }   // @a finish
        return out;                                      // @a finish
    }
}
