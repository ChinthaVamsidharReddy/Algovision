class NoRepeat {
    static int longest(String s) {                       // @a entry
        int[] last = new int[26];
        java.util.Arrays.fill(last, -1);                 // @a init
        int left = 0;                                    // @a init
        int best = 0;                                    // @a init
        for (int right = 0; right < s.length(); right++) {   // @a loop
            int c = s.charAt(right) - 'a';               // @a loop
            if (last[c] >= left) {                       // @a shrink
                left = last[c] + 1;                      // @a shrink
            }
            last[c] = right;                             // @a extend
            best = Math.max(best, right - left + 1);     // @a extend
        }
        return best;                                     // @a finish
    }
}
