#include <string>

int compressedLength(const std::string& s) {             // @a entry
    int total = 0;                                       // @a init
    int n = static_cast<int>(s.size());
    int i = 0;
    while (i < n) {
        int j = i;                                       // @a run
        while (j < n && s[j] == s[i]) {                  // @a run
            j++;                                         // @a run
        }
        int run = j - i;                                 // @a run
        total += 1 + (run > 1 ? static_cast<int>(std::to_string(run).size()) : 0);   // @a emit
        i = j;                                           // @a emit
    }
    return total;                                        // @a finish
}
