#include <string>

int firstUnique(const std::string& s) {                  // @a entry
    int count[26] = {0};
    for (char ch : s) {
        count[ch - 'a']++;                               // @a count
    }
    for (int i = 0; i < static_cast<int>(s.size()); i++) {
        if (count[s[i] - 'a'] == 1) {                    // @a scan
            return i;                                    // @a found
        }
    }
    return -1;                                           // @a none
}
