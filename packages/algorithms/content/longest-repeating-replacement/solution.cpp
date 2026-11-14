#include <algorithm>
#include <string>

int longestReplacement(const std::string& s, int k) {    // @a entry
    int freq[26] = {0};
    int left = 0;                                        // @a init
    int top = 0;                                         // @a init
    int best = 0;                                        // @a init
    for (int right = 0; right < static_cast<int>(s.size()); right++) {   // @a grow
        int c = s[right] - 'a';                          // @a grow
        freq[c]++;                                       // @a grow
        top = std::max(top, freq[c]);                    // @a grow
        if (right - left + 1 - top > k) {                // @a shrink
            freq[s[left] - 'a']--;                       // @a shrink
            left++;                                      // @a shrink
        }
        best = std::max(best, right - left + 1);         // @a record
    }
    return best;                                         // @a finish
}
