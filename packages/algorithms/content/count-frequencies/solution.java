import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


class Frequencies {
    static int[] countFrequencies(int[] values) {        // @a entry
        Map<Integer, Integer> count = new HashMap<>();   // @a init-map
        List<Integer> order = new ArrayList<>();         // @a init-map
        for (int v : values) {                           // @a loop
            if (!count.containsKey(v)) { order.add(v); } // @a first-seen
            count.merge(v, 1, Integer::sum);             // @a increment
        }
        int[] result = new int[order.size() * 2];        // @a build-output
        for (int k = 0; k < order.size(); k++) {         // @a build-output
            result[2 * k] = order.get(k);                // @a build-output
            result[2 * k + 1] = count.get(order.get(k)); // @a build-output
        }
        return result;                                   // @a finish
    }
}
