int queue_run(const int values[], int n, int removes, int queue[]) {  // @a entry
    int front = 0;
    int rear = 0;
    for (int i = 0; i < n; i++) {
        queue[rear] = values[i];                                     // @a enqueue
        rear++;                                                      // @a enqueue
    }
    for (int k = 0; k < removes; k++) {
        if (front == rear) {                                         // @a check-empty
            break;                                                   // @a underflow
        }
        front++;                                                     // @a dequeue
    }
    int size = rear - front;                                         // @a finish
    for (int i = 0; i < size; i++) {                                 // @a finish
        queue[i] = queue[front + i];                                 // @a finish
    }                                                                // @a finish
    return size;                                                     // @a finish
}
