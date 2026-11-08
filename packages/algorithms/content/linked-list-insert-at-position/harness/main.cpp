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
        int position;
        std::cin >> position;
        int value;
        std::cin >> value;
        head = insertAt(head, position, value);
        int count = 0;
        for (Node* p = head; p != nullptr; p = p->next) count++;
        std::cout << count;
        for (Node* p = head; p != nullptr; p = p->next) std::cout << ' ' << p->value;
        std::cout << '\n';
    }
    return 0;
}
