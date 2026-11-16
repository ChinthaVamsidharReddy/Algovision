#include <stdlib.h>

int trie_ops(const int *ops, int count) {                 // @a entry
    int (*next)[26] = calloc((size_t)count + 1, sizeof *next);// @a init
    char *end = calloc((size_t)count + 1, 1);             // @a init
    int nodes = 1;                                        // @a init
    int answers = 0;                                      // @a init
    int i = 0;
    while (i < count) {
        int code = ops[i];
        int len = ops[i + 1];
        int node = 0;                                     // @a op
        int found = 1;                                    // @a op
        for (int j = 0; j < len; j++) {
            int c = ops[i + 2 + j] - 'a';
            if (next[node][c] == 0) {                     // @a check
                if (code == 1) {
                    next[node][c] = nodes++;              // @a create
                } else {
                    found = 0;                            // @a miss
                    break;                                // @a miss
                }
            }
            node = next[node][c];                         // @a descend
        }
        if (code == 1) {
            end[node] = 1;                                // @a mark
        } else if (found) {
            answers += (code == 3 || end[node]) ? 1 : 0;  // @a answer
        }
        i += 2 + len;
    }
    free(next);
    free(end);
    return answers;                                       // @a finish
}
