int maxSlidingWindow(const int values[], int n, int k, int result[]) {   // @a entry
    std::vector<int> dq(n);                              // indices, front at dq[head]
    int head = 0;
    int tail = 0;
    for (int i = 0; i < n; i++) {                        // @a loop
        while (tail > head && values[dq[tail - 1]] <= values[i]) {   // @a pop-back
            tail--;                                      // @a pop-back
        }
        dq[tail++] = i;                                  // @a push-back
        if (dq[head] <= i - k) { head++; }               // @a pop-front
        if (i >= k - 1) {                                // @a record
            result[i - k + 1] = values[dq[head]];        // @a record
        }
    }
    return n - k + 1;                                    // @a finish
}
