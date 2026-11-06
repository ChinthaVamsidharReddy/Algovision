int removeDuplicates(int values[], int n) {                    // @a entry
    if (n == 0) return 0;                                // @a check-empty
    int slow = 0;                                        // @a init-slow
    for (int fast = 1; fast < n; fast++) {               // @a loop
        if (values[fast] != values[slow]) {              // @a compare
            slow++;                                      // @a advance-slow
            values[slow] = values[fast];                 // @a copy
        }
    }
    return slow + 1;                                     // @a finish
}
