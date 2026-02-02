from os import system
import json
import xml.etree.ElementTree as ET

for i in range(1, 170):
    system(f"cp ./Act\ 1/sheet#{i}/BINARY.png pages/sheet{i+4}.png")


with open('../data/Start of page bars.txt', 'r') as file:
    lines = file.readlines()[:174]

def parse_line(line):
    line = line.strip()
    if "#" in line:
        line = line.split("#")[0]
    return [int(i) for i in line.split('.') if i]

bar_starts = [parse_line(line) for line in lines]

num_bars = 715

bar_mappings = []

def get_mapping_for_bar(bar):
    for page in range(len(bar_starts)):
        for system in range(len(bar_starts[page])):
            if system + 1 == len(bar_starts[page]):
                upper_limit = bar_starts[page+1][0]
            else:
                upper_limit = bar_starts[page][system+1]
            if bar_starts[page][system] <= bar < upper_limit:
                return {"page": page+1, "system": system}

for i in range(1, num_bars):
    bar_mappings.append(get_mapping_for_bar(i))

expectedMeasureCounts = []
print(bar_starts)
for i in range(len(bar_starts)-1):
    if (bar_starts[i]):
        expectedMeasureCounts.append(bar_starts[i+1][0] - bar_starts[i][0])

def parseXML(i):
    with open(f"Act 1/sheet#{i}/sheet#{i}.xml", 'r') as file:
        tree = ET.parse(file)
        root = tree.getroot()
        for child in root:
            if child.tag == "page" and 'measure-count' in child.attrib:
                print(child.attrib['measure-count'], expectedMeasureCounts[i-1])
                return
    print("XXX", i)


for i in range(1, 170):
    parseXML(i)
with open("../site/data/bar_to_page.json", "w") as file:
    json.dump(bar_mappings, file)
