#include <string.h>

int is_palindrome(const char *s) {                       // @a entry
    int low = 0;                                         // @a init
    int high = (int)strlen(s) - 1;                       // @a init
    while (low < high) {
        if (s[low] != s[high]) {                         // @a compare
            return 0;                                    // @a mismatch
        }
        low++;                                           // @a advance
        high--;                                          // @a advance
    }
    return 1;                                            // @a finish
}
