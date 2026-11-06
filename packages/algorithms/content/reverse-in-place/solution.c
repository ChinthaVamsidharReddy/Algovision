void reverse_in_place(int values[], int n) {                  // @a entry
    int left = 0;                                        // @a init-left
    int right = n - 1;                                   // @a init-right
    while (left < right) {                               // @a loop
        int temp = values[left];                         // @a swap
        values[left] = values[right];                    // @a swap
        values[right] = temp;                            // @a swap
        left++;                                          // @a move
        right--;                                         // @a move
    }
    return;                                              // @a finish
}
