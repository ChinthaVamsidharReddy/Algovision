#include <stdio.h>
#include <stdlib.h>
#include "solution.c"

int main(void) {
    int cases;
    if (scanf("%d", &cases) != 1) return 1;
    while (cases--) {
        int n;
        if (scanf("%d", &n) != 1) return 1;
        char *s = malloc((size_t)n + 1);
        for (int i = 0; i < n; i++) {
            int v;
            if (scanf("%d", &v) != 1) return 1;
            s[i] = (char)v;
        }
        s[n] = '\0';
        printf("%d\n", longest_palindrome(s));
        free(s);
    }
    return 0;
}
