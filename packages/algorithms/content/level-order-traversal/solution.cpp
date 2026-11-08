#include <queue>
#include <vector>

struct Node {
    int value;
    Node* left;
    Node* right;
};


void levelOrder(const Node* root, std::vector<int>& out) {   // @a entry
    if (root == nullptr) { return; }
    std::queue<const Node*> queue;
    queue.push(root);                                    // @a enqueue-root
    while (!queue.empty()) {                             // @a loop
        const Node* node = queue.front();                // @a dequeue
        queue.pop();                                     // @a dequeue
        out.push_back(node->value);                      // @a visit
        if (node->left != nullptr) { queue.push(node->left); }     // @a enqueue-left
        if (node->right != nullptr) { queue.push(node->right); }   // @a enqueue-right
    }
    return;                                              // @a finish
}
