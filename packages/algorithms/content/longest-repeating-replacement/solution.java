class Replace {
    static int longest(String s, int k) {                // @a entry
        int[] freq = new int[26];
        int left = 0;                                    // @a init
        int top = 0;                                     // @a init
        int best = 0;                                    // @a init
        for (int right = 0; right < s.length(); right++) {   // @a grow
            int c = s.charAt(right) - 'a';               // @a grow
            freq[c]++;                                   // @a grow
            top = Math.max(top, freq[c]);                // @a grow
            if (right - left + 1 - top > k) {            // @a shrink
                freq[s.charAt(left) - 'a']--;            // @a shrink
                left++;                                  // @a shrink
            }
            best = Math.max(best, right - left + 1);     // @a record
        }
        return best;                                     // @a finish
    }
}
