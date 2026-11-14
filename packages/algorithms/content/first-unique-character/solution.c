#include <string.h>

int first_unique(const char *s) {                        // @a entry
    int count[26] = {0};
    int n = (int)strlen(s);
    for (int i = 0; i < n; i++) {
        count[s[i] - 'a']++;                             // @a count
    }
    for (int i = 0; i < n; i++) {
        if (count[s[i] - 'a'] == 1) {                    // @a scan
            return i;                                    // @a found
        }
    }
    return -1;                                           // @a none
}
