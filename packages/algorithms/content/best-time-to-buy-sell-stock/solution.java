class Stock {
    static int maxProfit(int[] values) {                 // @a entry
        int min = values[0];                             // @a init
        int best = 0;                                    // @a init
        for (int i = 1; i < values.length; i++) {        // @a loop
            if (values[i] < min) {                       // @a new-min
                min = values[i];                         // @a new-min
            } else {
                best = Math.max(best, values[i] - min);  // @a profit
            }
        }
        return best;                                     // @a finish
    }
}
