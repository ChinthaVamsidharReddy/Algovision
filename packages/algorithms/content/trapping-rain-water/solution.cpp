int trap(const int values[], int n) {                    // @a entry
    int left = 0, right = n - 1;                         // @a init
    int leftMax = 0, rightMax = 0, water = 0;            // @a init
    while (left < right) {                               // @a loop
        if (values[left] < values[right]) {              // @a compare
            if (values[left] >= leftMax) leftMax = values[left];   // @a left-side
            else water += leftMax - values[left];        // @a left-side
            left++;                                      // @a left-side
        } else {
            if (values[right] >= rightMax) rightMax = values[right];   // @a right-side
            else water += rightMax - values[right];      // @a right-side
            right--;                                     // @a right-side
        }
    }
    return water;                                        // @a finish
}
