#include <stdlib.h>
#include <string.h>

int longest_repeated(const char *s) {                     // @a entry
    int n = (int)strlen(s);
    int size = n * (n + 1) / 2 + 1;
    int (*next)[26] = calloc((size_t)size, sizeof *next); // @a init
    int *seen = calloc((size_t)size, sizeof(int));        // @a init
    int nodes = 1;                                        // @a init
    int best = 0;                                         // @a init
    for (int i = 0; i < n; i++) {
        int node = 0;                                     // @a suffix
        int depth = 0;                                    // @a suffix
        for (int j = i; j < n; j++) {
            int c = s[j] - 'a';
            if (next[node][c] == 0) {                     // @a check
                next[node][c] = nodes++;                  // @a create
            }
            node = next[node][c];                         // @a descend
            seen[node]++;                                 // @a descend
            depth++;                                      // @a descend
            if (seen[node] >= 2 && depth > best) {        // @a best
                best = depth;                             // @a best
            }
        }
    }
    free(seen);
    free(next);
    return best;                                          // @a finish
}
