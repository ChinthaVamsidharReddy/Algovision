#include <stdlib.h>

int is_valid(const int values[], int n) {                // @a entry
    int *stack = malloc(sizeof(int) * (size_t)(n > 0 ? n : 1));
    int top = 0;
    for (int i = 0; i < n; i++) {                        // @a loop
        int c = values[i];
        if (c % 2 == 1) {                                // @a check-open
            stack[top++] = c;                            // @a push
            continue;
        }
        if (top == 0) { free(stack); return 0; }         // @a check-empty
        if (stack[top - 1] != c - 1) { free(stack); return 0; }   // @a check-match
        top--;                                           // @a pop
    }
    int ok = (top == 0);                                 // @a finish
    free(stack);
    return ok;
}
