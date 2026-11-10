int maxProfit(const int values[], int n) {                    // @a entry
    int low = values[0];                                 // @a init
    int best = 0;                                        // @a init
    for (int i = 1; i < n; i++) {                        // @a loop
        if (values[i] < low) {                           // @a new-min
            low = values[i];                             // @a new-min
        } else if (values[i] - low > best) {             // @a profit
            best = values[i] - low;                      // @a profit
        }
    }
    return best;                                         // @a finish
}
