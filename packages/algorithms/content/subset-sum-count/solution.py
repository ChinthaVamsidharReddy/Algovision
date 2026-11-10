def count_subsets(values, target):               # @a entry
    return walk(values, 0, 0, target)


def walk(values, i, total, target):
    if total > target: return 0                  # @a prune
    if i == len(values): return 1 if total == target else 0   # @a base-case
    with_it = walk(values, i + 1, total + values[i], target)   # @a include
    without = walk(values, i + 1, total, target) # @a exclude
    return with_it + without                     # @a finish
