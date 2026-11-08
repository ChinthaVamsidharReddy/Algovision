#include <stdlib.h>

int evaluate(const int values[], int n) {                // @a entry
    int *stack = malloc(sizeof(int) * (size_t)(n > 0 ? n : 1));
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
    int answer = stack[0];                               // @a finish
    free(stack);
    return answer;
}
