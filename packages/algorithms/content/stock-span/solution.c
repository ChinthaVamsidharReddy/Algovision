int stock_span(const int values[], int n, int out[]) {         // @a entry
    int stack[16];
    int top = 0;
    for (int i = 0; i < n; i++) {                        // @a loop
        while (top > 0 && values[stack[top - 1]] <= values[i]) {   // @a while-check
            top--;                                       // @a pop
        }
        out[i] = (top == 0) ? i + 1 : i - stack[top - 1];   // @a compute
        stack[top++] = i;                                // @a push
    }
    return n;                                            // @a finish
}
