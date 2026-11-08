def merge_sort(values, temp, lo, hi):            # @a entry
    if lo >= hi:                                 # @a base-case
        return                                   # @a base-case
    mid = (lo + hi) // 2                         # @a split
    merge_sort(values, temp, lo, mid)            # @a recurse-left
    merge_sort(values, temp, mid + 1, hi)        # @a recurse-right
    merge(values, temp, lo, mid, hi)             # @a merge-call
    return                                       # @a finish


def merge(values, temp, lo, mid, hi):
    i, j, k = lo, mid + 1, lo                    # @a merge-init
    while i <= mid and j <= hi:
        if values[i] <= values[j]:               # @a merge-compare
            temp[k] = values[i]; i += 1; k += 1  # @a take-left
        else:
            temp[k] = values[j]; j += 1; k += 1  # @a take-right
    while i <= mid:                              # @a copy-rest
        temp[k] = values[i]; i += 1; k += 1      # @a copy-rest
    while j <= hi:                               # @a copy-rest
        temp[k] = values[j]; j += 1; k += 1      # @a copy-rest
    for t in range(lo, hi + 1):                  # @a write-back
        values[t] = temp[t]                      # @a write-back
