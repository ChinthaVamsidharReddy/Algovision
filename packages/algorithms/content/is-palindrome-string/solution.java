class Palindrome {
    static int isPalindrome(String s) {                  // @a entry
        int low = 0;                                     // @a init
        int high = s.length() - 1;                       // @a init
        while (low < high) {
            if (s.charAt(low) != s.charAt(high)) {       // @a compare
                return 0;                                // @a mismatch
            }
            low++;                                       // @a advance
            high--;                                      // @a advance
        }
        return 1;                                        // @a finish
    }
}
