#include <stdio.h>
#include <stdlib.h>
#include "solution.c"

int main(void) {
    int cases;
    if (scanf("%d", &cases) != 1) return 1;
    while (cases--) {
        int n;
        if (scanf("%d", &n) != 1) return 1;
        int* keys = malloc(sizeof(int) * (size_t)(n > 0 ? n : 1));
        for (int i = 0; i < n; i++) {
            if (scanf("%d", &keys[i]) != 1) return 1;
        }
        int size, key;
        if (scanf("%d %d", &size, &key) != 2) return 1;
        int* table = malloc(sizeof(int) * (size_t)size);
        for (int i = 0; i < size; i++) table[i] = -1;
        for (int k = 0; k < n; k++) {
            int index = keys[k] % size;
            int tries = 0;
            while (table[index] != -1 && tries < size) {
                index = (index + 1) % size;
                tries++;
            }
            if (tries < size) table[index] = keys[k];
        }
        printf("%d\n", search(table, size, key));
        free(table);
        free(keys);
    }
    return 0;
}
