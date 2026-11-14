def is_palindrome(s):                            # @a entry
    low = 0                                      # @a init
    high = len(s) - 1                            # @a init
    while low < high:
        if s[low] != s[high]:                    # @a compare
            return 0                             # @a mismatch
        low += 1                                 # @a advance
        high -= 1                                # @a advance
    return 1                                     # @a finish
