#include <iostream>
#include "solution.cpp"

int main() {
    int cases;
    std::cin >> cases;
    while (cases--) {
        int len;
        std::cin >> len;
        Node* head = nullptr;
        Node* tail = nullptr;
        for (int i = 0; i < len; i++) {
            int v;
            std::cin >> v;
            Node* node = new Node(v);
            if (tail == nullptr) head = node; else tail->next = node;
            tail = node;
        }
        std::cout << findMiddle(head) << '\n';
    }
    return 0;
}
