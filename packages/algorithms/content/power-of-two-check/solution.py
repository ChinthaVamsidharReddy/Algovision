def is_power_of_two(n):                          # @a entry
    if n <= 0: return 0                          # @a check-positive
    rest = n & (n - 1)                           # @a clear
    return 1 if rest == 0 else 0                 # @a finish
