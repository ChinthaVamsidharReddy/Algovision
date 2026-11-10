class Queens {
    static int count(int n) {                            // @a entry
        return place(new int[n], 0, n);
    }

    static boolean safe(int[] cols, int row, int c) {
        for (int r = 0; r < row; r++) {
            int diff = cols[r] - (c + 1);
            if (diff < 0) { diff = -diff; }
            if (cols[r] == c + 1 || diff == row - r) { return false; }
        }
        return true;
    }

    static int place(int[] cols, int row, int n) {
        if (row == n) { return 1; }                      // @a solution
        int total = 0;                                   // @a row
        for (int c = 0; c < n; c++) {                    // @a try
            if (safe(cols, row, c)) {                    // @a try
                cols[row] = c + 1;                       // @a place
                total += place(cols, row + 1, n);        // @a recurse
                cols[row] = 0;                           // @a remove
            }
        }
        return total;                                    // @a finish
    }
}
