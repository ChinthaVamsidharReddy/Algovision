int linearSearch(const int values[], int n, int target) {  // @a entry
    for (int i = 0; i < n; i++) {                          // @a loop
        if (values[i] == target) {                         // @a compare
            return i;                                      // @a found
        }
    }
    return -1;                                             // @a not-found
}
