import xml.etree.ElementTree as ET

with open('scanscore_xml/Act 3.xml', 'r', encoding='utf8') as f:
    tree = ET.parse(f)

for child in tree.getroot():
    if child.tag == "part":
        i = 0
        for measure in child:
            if measure.tag == "measure":
                for p in measure.findall("print"):
                    if "new-page" in p.attrib:
                        print(measure.attrib["number"])
                    if "new-system" in p.attrib:
                        print("--", measure.attrib["number"])
            else:
                raise(ValueError, "part should only have measures inside")