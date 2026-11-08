#include <stdlib.h>

void next_greater(const int values[], int n, int result[]) {   // @a entry
    int *stack = malloc(sizeof(int) * (size_t)(n > 0 ? n : 1));
    int top = 0;
    for (int i = 0; i < n; i++) { result[i] = -1; }      // @a init-result
    for (int i = 0; i < n; i++) {                        // @a loop
        while (top > 0 && values[stack[top - 1]] < values[i]) {   // @a while-check
            result[stack[--top]] = values[i];            // @a pop-assign
        }
        stack[top++] = i;                                // @a push
    }
    free(stack);                                         // @a finish
}
