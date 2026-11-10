def count_queens(n):                             # @a entry
    return place([0] * n, 0, n)


def safe(cols, row, c):
    for r in range(row):
        if cols[r] == c + 1 or abs(cols[r] - (c + 1)) == row - r:
            return False
    return True


def place(cols, row, n):
    if row == n: return 1                        # @a solution
    total = 0                                    # @a row
    for c in range(n):                           # @a try
        if safe(cols, row, c):                   # @a try
            cols[row] = c + 1                    # @a place
            total += place(cols, row + 1, n)     # @a recurse
            cols[row] = 0                        # @a remove
    return total                                 # @a finish
