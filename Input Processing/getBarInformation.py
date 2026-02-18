import xml.etree.ElementTree as ET

def getBarInformation(filename):
    with open('act1pagebars.txt') as f:
        lines = f.readlines()
        page_starts = [int(i.strip().split(".")[0]) for i in lines]
    pages = {}
    with open(filename, 'r', encoding='utf8') as f:
        tree = ET.parse(f)
    doPrint = True
    for measure in tree.findall(".//measure"):
        p = measure.find("print")
        measurenumber = int(measure.attrib["number"])
        measureattributes = measure.find("attributes")
        if measureattributes is not None:
            staffdetails = measureattributes.find("staff-details")
            if staffdetails is not None and "print-object" in staffdetails.attrib:
                doPrint = staffdetails.attrib["print-object"] == "yes"
        if p is not None and "page-number" in p.attrib:
            pagenumber = p.attrib["page-number"]
            if pagenumber not in pages:
                pages[pagenumber] = {
                    "first_bar_in_scan": measurenumber,
                    "measures": []
                }
        if measurenumber - pages[pagenumber]["first_bar_in_scan"] >= len(pages[pagenumber]["measures"]):
            pages[pagenumber]["measures"].append([])
        if doPrint:
            pages[pagenumber]["measures"][measurenumber-pages[pagenumber]["first_bar_in_scan"]].append(measure)

    pageWidth = float(tree.find(".//page-width").text)
    pageHeight = float(tree.find(".//page-height").text)
    defaultLeftMargin = float(tree.find(".//defaults").find(".//left-margin").text)
    defaultRightMargin = float(tree.find(".//defaults").find(".//right-margin").text)
    defaultTopMargin = float(tree.find(".//defaults").find(".//top-margin").text)
    defaultBottomMargin = float(tree.find(".//defaults").find(".//bottom-margin").text)

    defaultStaffDistance =  float(tree.find(".//defaults").find(".//staff-distance").text)

    for pagenumber in pages:
        p = pages[pagenumber]
        p["systems"] = [[]]
        sys_id = 0
        for measure in p["measures"]:
            printelement = measure[0].find("print")
            if printelement is not None and pagenumber > "1" and "new-system" in printelement.attrib:
                sys_id += 1
                p["systems"].append([])
            p["systems"][sys_id].append(measure)

    barmappings = {}
    for pagenumber in pages:
        p = pages[pagenumber]
        x = defaultLeftMargin
        y = defaultTopMargin
        height = 0
        measure_number = page_starts[(int(pagenumber) - 1)]
        system_number = 1
        for system in p["systems"]:
            sl = system[0][0].find("print").find("system-layout")
            if sl.find('top-system-distance') is not None:
                y += float(sl.find('top-system-distance').text)
            elif sl.find('system-distance') is not None:
                y += float(sl.find('system-distance').text)
            else:
                print("oops no system distance")
            for part in system[0]:
                printelement = part.find("print")
                assert printelement is not None
                height += 40 # staff
                if part != system[0]:
                    height += float(part.find(".//staff-distance").text)
            widths = []
            for measure in system:
                widths.append(float(measure[0].attrib["width"]))
            totalWidth = sum(widths)

            rightSystemMargin = float(system[0][0].find(".//right-margin").text)
            leftSystemMargin = float(system[0][0].find(".//right-margin").text)
            right = pageWidth - rightSystemMargin - 55
            # right = pageWidth - rightSystemMargin
            left = defaultLeftMargin + leftSystemMargin
            # if totalWidth > right - left:
            #     print("page", pagenumber, "too wide:", totalWidth, rightSystemMargin, defaultRightMargin, left)
            for i in range(len(widths)):
                widths[i] *= (right - left) / totalWidth
            xs = []
            for i in range(len(widths)):
                xs.append(right - sum(widths[i:]))

            if system_number == len(p["systems"]):
                height = pageHeight - y

            for i, measure in enumerate(system):
                measure_info = {}
                measure_info["page"] = int(pagenumber)
                measure_info["system_number"] = system_number
                measure_info["y"] = y / pageHeight
                measure_info["x"] = xs[i] / pageWidth
                measure_info["width"] = widths[i] / pageWidth
                measure_info["height"] = height / pageHeight
                measure_info['image'] = f'data/pages/Act1/sheet{pagenumber}.png'
                barmappings[str(measure_number)] = measure_info
                measure_number += 1
            system_number += 1
            y += height

    return barmappings

if __name__ == '__main__':
    # filename = 'scanscore_xml/Act 1.xml'
    filename = 'scanscore_xml/Act 1.xml'
    p = getBarInformation(filename)
    print("const bar_to_page =", [p, {}, {}], ";")