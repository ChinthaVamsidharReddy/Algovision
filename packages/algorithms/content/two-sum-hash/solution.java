import java.util.HashMap;
import java.util.Map;


class TwoSum {
    static int[] twoSum(int[] values, int target) {      // @a entry
        Map<Integer, Integer> seen = new HashMap<>();    // @a init-map
        for (int j = 0; j < values.length; j++) {        // @a loop
            int need = target - values[j];               // @a compute-complement
            if (seen.containsKey(need)) {                // @a check-seen
                return new int[] { seen.get(need), j };  // @a found
            }
            seen.put(values[j], j);                      // @a store
        }
        return new int[0];                               // @a not-found
    }
}
