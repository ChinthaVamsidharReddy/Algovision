#include <string>

int isPalindrome(const std::string& s) {                 // @a entry
    int low = 0;                                         // @a init
    int high = static_cast<int>(s.size()) - 1;           // @a init
    while (low < high) {
        if (s[low] != s[high]) {                         // @a compare
            return 0;                                    // @a mismatch
        }
        low++;                                           // @a advance
        high--;                                          // @a advance
    }
    return 1;                                            // @a finish
}
