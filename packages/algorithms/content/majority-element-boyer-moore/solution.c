int majority(const int values[], int n) {                    // @a entry
    int candidate = 0;                                   // @a init
    int count = 0;                                       // @a init
    for (int i = 0; i < n; i++) {                        // @a loop
        if (count == 0) { candidate = values[i]; }       // @a new-candidate
        count += (values[i] == candidate) ? 1 : -1;      // @a vote
    }
    return candidate;                                    // @a finish
}
