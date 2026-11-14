#include <string.h>

int longest_replacement(const char *s, int k) {          // @a entry
    int freq[26] = {0};
    int left = 0;                                        // @a init
    int top = 0;                                         // @a init
    int best = 0;                                        // @a init
    int n = (int)strlen(s);
    for (int right = 0; right < n; right++) {            // @a grow
        int c = s[right] - 'a';                          // @a grow
        freq[c]++;                                       // @a grow
        if (freq[c] > top) top = freq[c];                // @a grow
        if (right - left + 1 - top > k) {                // @a shrink
            freq[s[left] - 'a']--;                       // @a shrink
            left++;                                      // @a shrink
        }
        if (right - left + 1 > best) best = right - left + 1;   // @a record
    }
    return best;                                         // @a finish
}
