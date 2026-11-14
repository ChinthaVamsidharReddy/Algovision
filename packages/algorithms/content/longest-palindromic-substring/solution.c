#include <string.h>

int longest_palindrome(const char *s) {   // @a entry
    int n = (int)strlen(s);
    int best = 0;                                    // @a init
    for (int c = 0; c < 2 * n - 1; c++) {              // @a centre
        int left = c / 2;                                // @a centre
        int right = left + c % 2;                        // @a centre
        while (left >= 0 && right < n && s[left] == s[right]) {   // @a expand
            if (right - left + 1 > best) best = right - left + 1;   // @a expand
            left--;                                      // @a expand
            right++;                                     // @a expand
        }                                                // @a stop
    }
    return best;                                          // @a finish
}
