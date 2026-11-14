#include <string.h>

int count_palindromes(const char *s) {   // @a entry
    int n = (int)strlen(s);
    int total = 0;                                    // @a init
    for (int c = 0; c < 2 * n - 1; c++) {              // @a centre
        int left = c / 2;                                // @a centre
        int right = left + c % 2;                        // @a centre
        while (left >= 0 && right < n && s[left] == s[right]) {   // @a expand
            total++;   // @a expand
            left--;                                      // @a expand
            right++;                                     // @a expand
        }                                                // @a stop
    }
    return total;                                          // @a finish
}
