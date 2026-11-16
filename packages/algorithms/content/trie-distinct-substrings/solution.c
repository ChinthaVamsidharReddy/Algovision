#include <stdlib.h>
#include <string.h>

int count_distinct(const char *s) {                       // @a entry
    int n = (int)strlen(s);
    int size = n * (n + 1) / 2 + 1;
    int (*next)[26] = calloc((size_t)size, sizeof *next); // @a init
    int nodes = 1;                                        // @a init
    int count = 0;                                        // @a init
    for (int i = 0; i < n; i++) {
        int node = 0;                                     // @a suffix
        for (int j = i; j < n; j++) {
            int c = s[j] - 'a';
            if (next[node][c] == 0) {                     // @a check
                next[node][c] = nodes++;                  // @a create
                count++;                                  // @a create
            }
            node = next[node][c];                         // @a descend
        }
    }
    free(next);
    return count;                                         // @a finish
}
