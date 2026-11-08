class Hanoi {
    static int hanoi(int n) {                            // @a entry
        if (n == 0) { return 0; }                        // @a base-case
        int first = hanoi(n - 1);                        // @a recurse-first
        int second = hanoi(n - 1);                       // @a recurse-second
        return first + 1 + second;                       // @a move-disk
    }
}
