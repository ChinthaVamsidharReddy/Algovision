def factorial(n):                                # @a entry
    if n == 0: return 1                          # @a base-case
    sub = factorial(n - 1)                       # @a recurse
    return n * sub                               # @a combine
