def find_duplicate(values):                      # @a entry
    slow = values[0]                             # @a init
    fast = values[values[0]]                     # @a init
    while slow != fast:                          # @a phase1-loop
        slow = values[slow]                      # @a phase1-step
        fast = values[values[fast]]              # @a phase1-step
    slow = 0                                     # @a reset
    while slow != fast:                          # @a phase2-loop
        slow = values[slow]                      # @a phase2-step
        fast = values[fast]                      # @a phase2-step
    return slow                                  # @a finish
