#include <string.h>

int longest_no_repeat(const char *s) {                   // @a entry
    int last[26];
    for (int k = 0; k < 26; k++) last[k] = -1;           // @a init
    int left = 0;                                        // @a init
    int best = 0;                                        // @a init
    int n = (int)strlen(s);
    for (int right = 0; right < n; right++) {            // @a loop
        int c = s[right] - 'a';                          // @a loop
        if (last[c] >= left) {                           // @a shrink
            left = last[c] + 1;                          // @a shrink
        }
        last[c] = right;                                 // @a extend
        if (right - left + 1 > best) best = right - left + 1;   // @a extend
    }
    return best;                                         // @a finish
}
