class LruCache {
    static int lru(int[] ops, int capacity) {             // @a entry
        int[] slot = new int[1999];                       // @a init
        java.util.Arrays.fill(slot, -1);                  // @a init
        int[] keys = new int[capacity];                   // @a init
        int[] vals = new int[capacity];                   // @a init
        int[] prev = new int[capacity];                   // @a init
        int[] next = new int[capacity];                   // @a init
        java.util.Arrays.fill(prev, -1);                  // @a init
        java.util.Arrays.fill(next, -1);                  // @a init
        int head = -1, tail = -1, size = 0, total = 0;    // @a init
        int i = 0;
        while (i < ops.length) {
            int code = ops[i], n = ops[i + 1], key = ops[i + 2];
            int s = slot[key + 999];                      // @a lookup
            if (code == 2) {
                if (s == -1) {
                    total -= 1;                           // @a miss
                } else {
                    total += vals[s];                     // @a hit
                }
            } else if (s != -1) {
                vals[s] = ops[i + 3];                     // @a update
            } else {
                if (size == capacity) {
                    s = tail;                             // @a evict
                    slot[keys[s] + 999] = -1;             // @a evict
                    tail = prev[s];                       // @a evict
                    if (tail == -1) head = -1; else next[tail] = -1;// @a evict
                    prev[s] = -1;                         // @a evict
                    next[s] = -1;                         // @a evict
                    size--;                               // @a evict
                } else {
                    s = size;                             // @a insert
                }
                size++;                                   // @a insert
                keys[s] = key;                            // @a insert
                vals[s] = ops[i + 3];                     // @a insert
                slot[key + 999] = s;                      // @a insert
            }
            if (s != -1 && s != head) {
                if (prev[s] != -1) next[prev[s]] = next[s];// @a front
                if (next[s] != -1) prev[next[s]] = prev[s];// @a front
                if (tail == s) tail = prev[s];            // @a front
                prev[s] = -1;                             // @a front
                next[s] = head;                           // @a front
                if (head != -1) prev[head] = s;           // @a front
                head = s;                                 // @a front
                if (tail == -1) tail = s;                 // @a front
            }
            i += 2 + n;
        }
        return total;                                     // @a finish
    }
}
