import re

new = []
old = []

with open( '/var/tmp/new_extends.txt',encoding='utf-8')as f:
    new= f.readlines()
with open( '/var/tmp/old_extends.txt',encoding='utf-8')as f:
    old= f.readlines()

new_dict = {}
old_dict = {}

for entry in old:
    #print(entry)
    m = re.match(r'^\s*mxUtils\.extend\((\S+)\s*,\s*(\S+)\s*\).*', entry)
    if m:
      #print(m.group(1))
      #print(m.group(2))
      old_dict[m.group(1)] = m.group(2)

for entry in new:
    #print(entry)
    m = re.match(r'^\s*class\s+(\S+)\s+extends\s+(\S+)\s+{.*', entry)
    if m:
      #print(m.group(1))
      #print(m.group(2))
      new_dict[m.group(1)] = m.group(2)


#print(old_dict)
#print(new_dict)

for k in new_dict:
    if new_dict[k] != old_dict[k]:
       print(k)
       print("   new:"+new_dict[k])
       print("   old:"+old_dict[k])


