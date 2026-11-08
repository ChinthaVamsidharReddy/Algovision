void nextGreater(const int values[], int n, int result[]) {   // @a entry
    std::vector<int> stack(n);
    int top = 0;
    for (int i = 0; i < n; i++) { result[i] = -1; }      // @a init-result
    for (int i = 0; i < n; i++) {                        // @a loop
        while (top > 0 && values[stack[top - 1]] < values[i]) {   // @a while-check
            result[stack[--top]] = values[i];            // @a pop-assign
        }
        stack[top++] = i;                                // @a push
    }
}                                                        // @a finish
