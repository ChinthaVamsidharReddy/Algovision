def sum_digits(n):                               # @a entry
    if n < 10: return n                          # @a base-case
    rest = sum_digits(n // 10)                   # @a recurse
    return n % 10 + rest                         # @a combine
