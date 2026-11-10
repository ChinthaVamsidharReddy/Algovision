int can_jump(const int values[], int n) {                    // @a entry
    int reach = 0;                                       // @a init
    for (int i = 0; i < n; i++) {                        // @a loop
        if (i > reach) { return 0; }                     // @a stuck
        if (i + values[i] > reach) { reach = i + values[i]; }   // @a extend
    }
    return 1;                                            // @a finish
}
