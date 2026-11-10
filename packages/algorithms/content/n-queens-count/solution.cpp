static int safe(const int cols[], int row, int c) {
    for (int r = 0; r < row; r++) {
        int diff = cols[r] - (c + 1);
        if (diff < 0) { diff = -diff; }
        if (cols[r] == c + 1 || diff == row - r) { return 0; }
    }
    return 1;
}

static int place(int cols[], int row, int n) {
    if (row == n) { return 1; }                          // @a solution
    int total = 0;                                       // @a row
    for (int c = 0; c < n; c++) {                        // @a try
        if (safe(cols, row, c)) {                        // @a try
            cols[row] = c + 1;                           // @a place
            total += place(cols, row + 1, n);            // @a recurse
            cols[row] = 0;                               // @a remove
        }
    }
    return total;                                        // @a finish
}

int countQueens(int n) {                                        // @a entry
    int cols[8] = {0};
    return place(cols, 0, n);
}
