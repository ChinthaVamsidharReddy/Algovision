class Jump {
    static int canJump(int[] values) {                   // @a entry
        int reach = 0;                                   // @a init
        for (int i = 0; i < values.length; i++) {        // @a loop
            if (i > reach) { return 0; }                 // @a stuck
            reach = Math.max(reach, i + values[i]);      // @a extend
        }
        return 1;                                        // @a finish
    }
}
