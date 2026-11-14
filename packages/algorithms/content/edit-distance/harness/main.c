#include <stdio.h>
#include <stdlib.h>
#include "solution.c"

int main(void) {
    int cases;
    if (scanf("%d", &cases) != 1) return 1;
    while (cases--) {
        int ns;
        if (scanf("%d", &ns) != 1) return 1;
        char *s = malloc((size_t)ns + 1);
        for (int i = 0; i < ns; i++) {
            int v;
            if (scanf("%d", &v) != 1) return 1;
            s[i] = (char)v;
        }
        s[ns] = '\0';
        int nt;
        if (scanf("%d", &nt) != 1) return 1;
        char *t = malloc((size_t)nt + 1);
        for (int i = 0; i < nt; i++) {
            int v;
            if (scanf("%d", &v) != 1) return 1;
            t[i] = (char)v;
        }
        t[nt] = '\0';
        printf("%d\n", edit_distance(s, t));
        free(s);
        free(t);
    }
    return 0;
}
