class FirstUnique {
    static int firstUnique(String s) {                   // @a entry
        int[] count = new int[26];
        for (int i = 0; i < s.length(); i++) {
            count[s.charAt(i) - 'a']++;                  // @a count
        }
        for (int i = 0; i < s.length(); i++) {
            if (count[s.charAt(i) - 'a'] == 1) {         // @a scan
                return i;                                // @a found
            }
        }
        return -1;                                       // @a none
    }
}
