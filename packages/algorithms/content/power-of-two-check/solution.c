int is_power_of_two(int n) {                                        // @a entry
    if (n <= 0) { return 0; }                            // @a check-positive
    int rest = n & (n - 1);                              // @a clear
    return rest == 0 ? 1 : 0;                            // @a finish
}
