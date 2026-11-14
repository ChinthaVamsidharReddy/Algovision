#include <string.h>

int compressed_length(const char *s) {                   // @a entry
    int total = 0;                                       // @a init
    int n = (int)strlen(s);
    int i = 0;
    while (i < n) {
        int j = i;                                       // @a run
        while (j < n && s[j] == s[i]) {                  // @a run
            j++;                                         // @a run
        }
        int run = j - i;                                 // @a run
        total += 1 + (run > 1 ? (run < 10 ? 1 : 2) : 0); // @a emit
        i = j;                                           // @a emit
    }
    return total;                                        // @a finish
}
