
grep " extends "   ./js/Shapes.js       > /var/tmp/new_extends.txt
grep "\.extend("   ./js_org/Shapes.js   > /var/tmp/old_extends.txt

python3 extends_check.py



