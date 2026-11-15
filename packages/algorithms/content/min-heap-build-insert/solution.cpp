void buildHeapByInsert(int values[], int n) {            // @a entry
    for (int i = 1; i < n; i++) {                        // @a insert
        int child = i;                                   // @a insert
        while (child > 0) {                              // @a sift-up
            int parent = (child - 1) / 2;                // @a sift-up
            if (values[parent] <= values[child]) {       // @a compare
                break;                                   // @a stop
            }
            int tmp = values[parent];                    // @a swap
            values[parent] = values[child];              // @a swap
            values[child] = tmp;                         // @a swap
            child = parent;                              // @a swap
        }
    }
    return;                                              // @a finish
}
