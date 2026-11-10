int maxProduct(const int values[], int n) {                    // @a entry
    int hi = values[0], lo = values[0], best = values[0];   // @a init
    for (int i = 1; i < n; i++) {                        // @a loop
        int x = values[i];                               // @a loop
        int a = hi * x, b = lo * x;                      // @a update
        int top = x > a ? x : a;                         // @a update
        top = top > b ? top : b;                         // @a update
        int bottom = x < a ? x : a;                      // @a update
        bottom = bottom < b ? bottom : b;                // @a update
        hi = top;                                        // @a update
        lo = bottom;                                     // @a update
        if (hi > best) { best = hi; }                    // @a best
    }
    return best;                                         // @a finish
}
