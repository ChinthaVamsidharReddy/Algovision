int evaluate(const int values[], int n) {                // @a entry
    std::vector<int> stack(n);
    int top = 0;
    for (int i = 0; i < n; i++) {                        // @a loop
        int t = values[i];
        if (t >= 0) {                                    // @a check-operand
            stack[top++] = t;                            // @a push-operand
            continue;
        }
        int right = stack[--top];                        // @a pop-right
        int left = stack[--top];                         // @a pop-left
        int result;                                      // @a apply
        if (t == -1) { result = left + right; }          // @a apply
        else if (t == -2) { result = left - right; }     // @a apply
        else if (t == -3) { result = left * right; }     // @a apply
        else { result = left / right; }                  // @a apply
        stack[top++] = result;                           // @a push-result
    }
    return stack[0];                                     // @a finish
}
