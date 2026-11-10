class Majority {
    static int majority(int[] values) {                  // @a entry
        int candidate = 0;                               // @a init
        int count = 0;                                   // @a init
        for (int x : values) {                           // @a loop
            if (count == 0) { candidate = x; }           // @a new-candidate
            count += (x == candidate) ? 1 : -1;          // @a vote
        }
        return candidate;                                // @a finish
    }
}
