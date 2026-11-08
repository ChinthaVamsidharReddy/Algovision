int maxArea(const int height[], int n) {            // @a entry
    int left = 0, right = n - 1, best = 0;               // @a init
    while (left < right) {                               // @a loop
        int h = height[left] < height[right] ? height[left] : height[right];   // @a measure
        int area = h * (right - left);                   // @a area
        if (area > best) { best = area; }                // @a update-best
        if (height[left] < height[right]) {
            left++;                                      // @a move-left
        } else {
            right--;                                     // @a move-right
        }
    }
    return best;                                         // @a finish
}
