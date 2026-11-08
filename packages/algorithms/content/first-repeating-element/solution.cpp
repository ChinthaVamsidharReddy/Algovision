#include <unordered_set>


int firstRepeating(const int values[], int n) {          // @a entry
    std::unordered_set<int> seen;                        // @a init-set
    for (int i = 0; i < n; i++) {                        // @a loop
        int v = values[i];
        if (seen.count(v) > 0) {                         // @a check-seen
            return v;                                    // @a found
        }
        seen.insert(v);                                  // @a store
    }
    return -1;                                           // @a not-found
}
