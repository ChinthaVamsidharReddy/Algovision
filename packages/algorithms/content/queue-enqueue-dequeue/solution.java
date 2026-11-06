import java.util.Arrays;

class QueueDemo {
    static int[] run(int[] values, int removes) {        // @a entry
        int[] queue = new int[values.length];
        int front = 0;
        int rear = 0;
        for (int v : values) {
            queue[rear] = v;                             // @a enqueue
            rear++;                                      // @a enqueue
        }
        for (int k = 0; k < removes; k++) {
            if (front == rear) {                         // @a check-empty
                break;                                   // @a underflow
            }
            front++;                                     // @a dequeue
        }
        return Arrays.copyOfRange(queue, front, rear);   // @a finish
    }
}
