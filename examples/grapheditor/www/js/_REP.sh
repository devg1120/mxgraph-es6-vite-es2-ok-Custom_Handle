
TARGET_DIR="./"

BEFORE="\"\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/dist\/mxgraph\.es\.js\""
AFTER="\"\.\.\/\.\.\/\.\.\/\.\.\/dist\/mxgraph\.es\.js\""
find ${TARGET_DIR}  -type f
find ${TARGET_DIR}  -type f | xargs sed -i "s/${BEFORE}/${AFTER}/g"
