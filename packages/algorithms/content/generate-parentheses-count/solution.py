def count_parentheses(n):                        # @a entry
    return build([0] * (2 * n), 0, 0, 0, n)


def build(s, pos, open_, close, n):
    if pos == 2 * n: return 1                    # @a complete
    total = 0
    if open_ < n:                                # @a add-open
        s[pos] = 1                               # @a add-open
        total += build(s, pos + 1, open_ + 1, close, n)   # @a add-open
    if close < open_:                            # @a add-close
        s[pos] = 2                               # @a add-close
        total += build(s, pos + 1, open_, close + 1, n)   # @a add-close
    s[pos] = 0                                   # @a finish
    return total                                 # @a finish
