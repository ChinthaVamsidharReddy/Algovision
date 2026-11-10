def gcd(a, b):                                   # @a entry
    while b != 0:                                # @a loop
        r = a % b                                # @a remainder
        a = b                                    # @a shift
        b = r                                    # @a shift
    return a                                     # @a finish
