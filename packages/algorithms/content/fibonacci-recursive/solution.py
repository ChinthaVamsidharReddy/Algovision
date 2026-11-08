def fib(n):                                      # @a entry
    if n <= 1: return n                          # @a base-case
    left = fib(n - 1)                            # @a recurse-left
    right = fib(n - 2)                           # @a recurse-right
    return left + right                          # @a combine
