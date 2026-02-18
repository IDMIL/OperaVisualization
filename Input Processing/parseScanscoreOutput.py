import xml.etree.ElementTree as ET

bar_mappings = [{}, {}, {}]



for actNumber in (1, 2, 3):
    pagedir = 'Act' + str(actNumber)

    with open(f'scanscore_xml/Act {actNumber}.xml', 'r', encoding='utf8') as f:
        tree = ET.parse(f)

    pageWidth = float(tree.find(".//page-width").text)
    pageHeight = float(tree.find(".//page-height").text)

    defaultLeftMargin = float(tree.find(".//defaults").find(".//left-margin").text)
    defaultRightMargin = float(tree.find(".//defaults").find(".//right-margin").text)
    defaultTopMargin = float(tree.find(".//defaults").find(".//top-margin").text)
    defaultBottomMargin = float(tree.find(".//defaults").find(".//bottom-margin").text)

    defaultStaffDistance =  float(tree.find(".//defaults").find(".//staff-distance").text)


    for child in tree.getroot():
        if child.tag == "part":
            page = 1
            x = defaultLeftMargin
            y = defaultTopMargin
            for measure in child:
                if measure.tag == "measure":
                    measureWidth = float(measure.attrib["width"])

                    p = measure.find("print")
                    if p is not None:
                        if "new-page" in p.attrib:
                            page += 1
                            x = defaultLeftMargin + float(p.find("system-layout").find("system-margins").find("left-margin").text)
                            y = defaultTopMargin + float(p.find("system-layout").find("top-system-distance").text)
                        if "new-system" in p.attrib:
                            x = defaultLeftMargin + float(p.find("system-layout").find("system-margins").find("left-margin").text)

                    bar_mappings[actNumber - 1][measure.attrib["number"]] = {
                        "page": page, "image": f"data/pages/{pagedir}/sheet{page}.png",
                        "x": x/pageWidth, "y": y/pageHeight, "width": measureWidth/pageWidth, "height": (pageHeight - defaultBottomMargin - y)/pageHeight}
                    x += measureWidth
                else:
                    raise(ValueError, "part should only have measures inside")

print(bar_mappings)