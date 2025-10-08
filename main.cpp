#include <iostream>
#include <cmath>
using namespace std;

int main() {
    char c1, c2;
    int x  ;
    cin >> c1 >> c2 >> x;
    cout << "Ma ASCII của ky tu `" << c1 << "', `" << c2 << "' lan luot la " << (int)c1 << " va " << (int)c2 << endl
     << "Khoang cach giua hai ky tu `" << c1 << "', `" << c2 << "' la " << abs((int)c1 - (int)c2) << endl
     << "Dang viet hoa cua ky tu `" << c1<< "' la `" << (char)toupper(c1) << "'" << endl
     << x << " la ma ASCII cua ky tu `" << static_cast<char>(x) << "'" << endl;

    return 0;
}