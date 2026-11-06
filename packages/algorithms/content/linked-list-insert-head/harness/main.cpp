#include <iostream>
#include "solution.cpp"

int main() {
    int cases;
    std::cin >> cases;
    while (cases--) {
        int n;
        std::cin >> n;
        LinkedList list;
        Node* tail = nullptr;
        for (int i = 0; i < n; i++) {
            int v;
            std::cin >> v;
            Node* node = new Node(v);
            if (tail == nullptr) list.head = node; else tail->next = node;
            tail = node;
        }
        int x;
        std::cin >> x;
        list.insertAtHead(x);
        int count = 0;
        for (Node* p = list.head; p != nullptr; p = p->next) count++;
        std::cout << count;
        for (Node* p = list.head; p != nullptr; p = p->next) std::cout << ' ' << p->value;
        std::cout << '\n';
    }
    return 0;
}
