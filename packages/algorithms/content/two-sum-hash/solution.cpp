#include <unordered_map>


int twoSum(const int values[], int n, int target, int out[]) {   // @a entry
    std::unordered_map<int, int> seen;                   // @a init-map
    for (int j = 0; j < n; j++) {                        // @a loop
        int need = target - values[j];                   // @a compute-complement
        if (seen.count(need) > 0) {                      // @a check-seen
            out[0] = seen[need];                         // @a found
            out[1] = j;                                  // @a found
            return 2;                                    // @a found
        }
        seen[values[j]] = j;                             // @a store
    }
    return 0;                                            // @a not-found
}
