int isValid(const int values[], int n) {                 // @a entry
    std::vector<int> stack(n);
    int top = 0;
    for (int i = 0; i < n; i++) {                        // @a loop
        int c = values[i];
        if (c % 2 == 1) {                                // @a check-open
            stack[top++] = c;                            // @a push
            continue;
        }
        if (top == 0) { return 0; }                      // @a check-empty
        if (stack[top - 1] != c - 1) { return 0; }       // @a check-match
        top--;                                           // @a pop
    }
    return top == 0 ? 1 : 0;                             // @a finish
}
