class Compress {
    static int length(String s) {                        // @a entry
        int total = 0;                                   // @a init
        int i = 0;
        while (i < s.length()) {
            int j = i;                                   // @a run
            while (j < s.length() && s.charAt(j) == s.charAt(i)) {   // @a run
                j++;                                     // @a run
            }
            int run = j - i;                             // @a run
            total += 1 + (run > 1 ? String.valueOf(run).length() : 0);   // @a emit
            i = j;                                       // @a emit
        }
        return total;                                    // @a finish
    }
}
