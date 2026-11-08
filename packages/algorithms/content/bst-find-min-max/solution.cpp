#include <vector>

struct Node {
    int value;
    Node* left;
    Node* right;
};


void findMinMax(const Node* root, std::vector<int>& out) {   // @a entry
    const Node* current = root;                          // @a init-min
    while (current->left != nullptr) {                   // @a loop-min
        current = current->left;                         // @a go-left
    }
    out.push_back(current->value);                       // @a record-min
    current = root;                                      // @a init-max
    while (current->right != nullptr) {                  // @a loop-max
        current = current->right;                        // @a go-right
    }
    out.push_back(current->value);                       // @a record-max
    return;                                              // @a finish
}
