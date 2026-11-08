#include <stdio.h>
#include <stdlib.h>
#include "solution.c"

static Node* insert_node(Node* root, int v) {
    if (root == NULL) {
        Node* created = malloc(sizeof(Node));
        created->value = v;
        created->left = NULL;
        created->right = NULL;
        return created;
    }
    if (v < root->value) root->left = insert_node(root->left, v);
    else root->right = insert_node(root->right, v);
    return root;
}

static void release(Node* root) {
    if (root == NULL) return;
    release(root->left);
    release(root->right);
    free(root);
}

int main(void) {
    int cases;
    if (scanf("%d", &cases) != 1) return 1;
    while (cases--) {
        int n;
        if (scanf("%d", &n) != 1) return 1;
        Node* root = NULL;
        for (int i = 0; i < n; i++) {
            int v;
            if (scanf("%d", &v) != 1) return 1;
            root = insert_node(root, v);
        }
        printf("%d\n", count_leaves(root));
        release(root);
    }
    return 0;
}
