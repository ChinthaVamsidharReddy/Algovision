#include <unordered_map>
#include <vector>


int countFrequencies(const int values[], int n, int out[]) {   // @a entry
    std::unordered_map<int, int> count;                  // @a init-map
    std::vector<int> order;                              // @a init-map
    for (int i = 0; i < n; i++) {                        // @a loop
        int v = values[i];
        if (count.find(v) == count.end()) { order.push_back(v); }   // @a first-seen
        count[v]++;                                      // @a increment
    }
    for (size_t k = 0; k < order.size(); k++) {          // @a build-output
        out[2 * k] = order[k];                           // @a build-output
        out[2 * k + 1] = count[order[k]];                // @a build-output
    }
    return (int)(2 * order.size());                      // @a finish
}
