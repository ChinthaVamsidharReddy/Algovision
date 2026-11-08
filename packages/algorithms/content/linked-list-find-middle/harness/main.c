#include <stdio.h>
#include "solution.c"

int main(void) {
    int cases;
    if (scanf("%d", &cases) != 1) return 1;
    while (cases--) {
        int len;
        if (scanf("%d", &len) != 1) return 1;
        Node *head = NULL, *tail = NULL;
        for (int i = 0; i < len; i++) {
            int v;
            if (scanf("%d", &v) != 1) return 1;
            Node *node = malloc(sizeof(Node));
            node->value = v;
            node->next = NULL;
            if (tail == NULL) head = node; else tail->next = node;
            tail = node;
        }
        printf("%d\n", find_middle(head));
    }
    return 0;
}
