import os.path
import json

mappings = [{}, {}, {}]
num_bars = [717, 818, 392]
for act in range(3):

    act_number = act + 1

    with open(f"act{act_number}_bounding_boxes.json") as f:
        concertcue_data = json.load(f)["data"]["score"]["barcoords"]


    with open(f'act{act_number}pagebars.txt', 'r') as f:
        lines = f.readlines()
    lines = [int(l.split("#")[0].strip().split(".")[0]) for l in lines]
    for b in range(num_bars[act]):
        page = -1
        for pagei, start_bar in enumerate(lines):
            if start_bar <= b + 1 and (pagei + 1 == len(lines) or lines[pagei + 1] > b + 1):
                page = pagei + 1
                break
        if page < 0:
            raise ValueError

        if os.path.exists(f'../site/data/pages/Act{act_number}/annotated/sheet{page}.png'):
            imagePath = f'data/pages/Act{act_number}/annotated/sheet{page}.png'
        else:
            imagePath = f'data/pages/Act{act_number}/sheet{page}.png'
        mappings[act][b + 1] = {
            'page' : page,
            'x': concertcue_data[b]["x1"],
            'y': concertcue_data[b]["y1"],
            'w': concertcue_data[b]["x2"] - concertcue_data[b]["x1"],
            'h': concertcue_data[b]["y2"] - concertcue_data[b]["y1"],
            'image': imagePath
        }

with open(f'../site/src/data/barToPage.ts', 'w') as f:
    f.write("""export interface BarInfo {
    page: number;
    x: number;
    w: number;
    y: number;
    h: number;
    image: string;
}

export interface ActInfo {
    [index : string] : BarInfo;
}

export const act_starting_pages = [5, 174, 381];

export const bar_to_page : Array<ActInfo> = """ + str(mappings) + ";")

pvMappings = [{}, {}, {}]
with open('PV_bounding_boxes.json') as f:
    data = json.load(f)
for coord in data['data']['score']['barcoords']:
    barNumber = coord['barIdx']
    actNumber = 1
    for act_num_bars in num_bars:
        if barNumber >= act_num_bars:
            barNumber -= act_num_bars
            actNumber += 1
        else:
            break
    pvMappings[actNumber - 1][barNumber + 1] = {
        'page' : coord['pageIdx']+1,
        'x': coord["x1"],
        'y': coord["y1"],
        'w': coord["x2"] - coord["x1"],
        'h': coord["y2"] - coord["y1"],
        'image': f'data/PVpages/page_{coord["pageIdx"]+1:03d}.png'
    }

with open(f'../site/src/data/PVbarToPage.ts', 'w') as f:
    f.write("""import {ActInfo} from "./barToPage";
export const PV_bar_to_page : Array<ActInfo> = """ + str(pvMappings) + ";")
