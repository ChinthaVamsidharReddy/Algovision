def first_unique(s):                             # @a entry
    count = [0] * 26
    for ch in s:
        count[ord(ch) - 97] += 1                 # @a count
    for i, ch in enumerate(s):
        if count[ord(ch) - 97] == 1:             # @a scan
            return i                             # @a found
    return -1                                    # @a none
