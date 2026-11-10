static int build(int s[], int pos, int open, int close, int n) {
    if (pos == 2 * n) { return 1; }                      // @a complete
    int total = 0;
    if (open < n) {                                      // @a add-open
        s[pos] = 1;                                      // @a add-open
        total += build(s, pos + 1, open + 1, close, n);  // @a add-open
    }
    if (close < open) {                                  // @a add-close
        s[pos] = 2;                                      // @a add-close
        total += build(s, pos + 1, open, close + 1, n);  // @a add-close
    }
    s[pos] = 0;                                          // @a finish
    return total;                                        // @a finish
}

int count_parentheses(int n) {                                        // @a entry
    int s[16] = {0};
    return build(s, 0, 0, 0, n);
}
