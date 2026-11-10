class Product {
    static int maxProduct(int[] values) {                // @a entry
        int hi = values[0], lo = values[0], best = values[0];   // @a init
        for (int i = 1; i < values.length; i++) {        // @a loop
            int x = values[i];                           // @a loop
            int a = hi * x, b = lo * x;                  // @a update
            hi = Math.max(x, Math.max(a, b));            // @a update
            lo = Math.min(x, Math.min(a, b));            // @a update
            if (hi > best) { best = hi; }                // @a best
        }
        return best;                                     // @a finish
    }
}
