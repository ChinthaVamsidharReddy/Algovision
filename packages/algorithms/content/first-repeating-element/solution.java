import java.util.HashSet;
import java.util.Set;


class FirstRepeating {
    static int firstRepeating(int[] values) {            // @a entry
        Set<Integer> seen = new HashSet<>();             // @a init-set
        for (int v : values) {                           // @a loop
            if (seen.contains(v)) {                      // @a check-seen
                return v;                                // @a found
            }
            seen.add(v);                                 // @a store
        }
        return -1;                                       // @a not-found
    }
}
