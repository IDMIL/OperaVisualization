export interface SectionAnnotation {
    annotation: string,
    range: [number, number]
}

export interface SceneArchitecture {
    [sceneNumber: number] : {
        scene_name: string,
        annotations: Array<SectionAnnotation>
    }
}

export interface Architecture {
    [actNumber : number] : SceneArchitecture
}

export const architecture : Architecture = {
    1: {
        1: {
            scene_name: "Première Scène : Suite",
            annotations: [
                {"annotation": "Prélude", "range": [1, 29]},
                {"annotation": "Pavane", "range": [30, 50]},
                {"annotation": "Cadenza pour alto seul", "range": [51, 64]},
                {"annotation": "Gigue", "range": [65, 108]},
                {"annotation": "Cadenza pour contrebasson", "range": [109, 114]},
                {"annotation": "Quasi Gavotte", "range": [115, 136]},
                {"annotation": "Air", "range": [136, 153]},
                {"annotation": "Coda", "range": [153, 171]},
                {"annotation": "Rideau", "range": [172, 172]},
                {"annotation": "Interlude orchestral — Changement de scène", "range": [173, 200]},
            ]
        },
        2: {
            scene_name: "Deuxième Scène : Rhapsodie sur trois accords — Chant de chasseur en trois strophes",
            annotations: [
                {"annotation": "Rhapsodie", "range": [201, 211]},
                {"annotation": "Chant de chasseur — 1ère strophe", "range": [212, 222]},
                {"annotation": "Rhapsodie", "range": [223, 248]},
                {"annotation": "Chant de chasseur — 2ième strophe", "range": [249, 256]},
                {"annotation": "Rhapsodie et Chant de chasseur — 3ième strophe", "range": [257, 270]},
                {"annotation": "Cataclysme", "range": [271, 299]},
                {"annotation": "Coda", "range": [300, 310]},
                {"annotation": "Interlude orchestral — Changement de scène", "range": [311, 325]},
                {"annotation": "Approche de la musique militaire", "range": [326, 327]},
                {"annotation": "Levée du rideau", "range": [328, 329]},
            ]
        },
        3: {
            scene_name: "Troisième Scène : Marche militaire et berceuse",
            annotations: [
                {"annotation": "Introduction", "range": [330, 333]},
                {"annotation": "Marche militaire", "range": [334, 345]},
                {"annotation": "Quasi Trio", "range": [346, 362]},
                {"annotation": "Introduction à la berceuse", "range": [363, 371]},
                {"annotation": "Berceuse — Premier couplet", "range": [372, 379]},
                {"annotation": "Berceuse — Refrain", "range": [380, 387]},
                {"annotation": "Berceuse — Deuxième couplet", "range": [388, 395]},
                {"annotation": "Berceuse — Refrain", "range": [396, 416]},
                {"annotation": "Coda de la berceuse", "range": [417, 424]},
                {"annotation": "Arrivée de Wozzeck — Épisode durchkomponiert", "range": [425, 472]},
                {"annotation": "Interlude orchestral — Changement de scène", "range": [473, 487]},
            ]
        },
        4: {
            scene_name: "Quatrième Scène : Passacaille",
            annotations: [
                {"annotation": "Thème", "range": [488, 495]},
                {"annotation": "Variation 1", "range": [496, 502]},
                {"annotation": "Variation 2", "range": [503, 509]},
                {"annotation": "Variation 3", "range": [510, 516]},
                {"annotation": "Variation 4", "range": [517, 523]},
                {"annotation": "Variation 5", "range": [524, 530]},
                {"annotation": "Variation 6", "range": [531, 537]},
                {"annotation": "Variation 7", "range": [538, 538]},
                {"annotation": "Variation 8", "range": [539, 545]},
                {"annotation": "Variation 9", "range": [546, 552]},
                {"annotation": "Variation 10", "range": [553, 553]},
                {"annotation": "Variation 11", "range": [554, 560]},
                {"annotation": "Variation 12", "range": [561, 561]},
                {"annotation": "Variation 13", "range": [562, 568]},
                {"annotation": "Variation 14", "range": [569, 575]},
                {"annotation": "Variation 15", "range": [576, 582]},
                {"annotation": "Variation 16", "range": [583, 589]},
                {"annotation": "Variation 17", "range": [590, 596]},
                {"annotation": "Variation 18", "range": [597, 610]},
                {"annotation": "Variation 19", "range": [611, 619]},
                {"annotation": "Variation 20", "range": [620, 637]},
                {"annotation": "Variation 21", "range": [638, 645]},
                {"annotation": "Interlude orchestral — Changement de scène (Andante affettuoso)", "range": [656, 665]},
            ]
        },
        5: {
            scene_name: "Cinquième Scène : Quasi Rondo",
            annotations: [
                {"annotation": "Section 1", "range": [666, 676]},
                {"annotation": "Section 2", "range": [677, 685]},
                {"annotation": "Section 3", "range": [686, 693]},
                {"annotation": "Section 4", "range": [693, 698]},
                {"annotation": "Pause", "range": [699, 699]},
                {"annotation": "Section 5", "range": [700, 701]},
                {"annotation": "Section 6", "range": [702, 709]},
                {"annotation": "Section 7", "range": [709, 715]},
            ]
        }
    },
    2: {
        1: {
            scene_name: "Premier mouvement : Sonate",
            annotations: [
                {"annotation": "Introduction", "range": [1, 6]},
                {"annotation": "Exposition — Section principale", "range": [7, 28]},
                {"annotation": "Exposition — Thème 1 (Boucles d'oreilles)", "range": [7, 24]},
                {"annotation": "Exposition — Transition", "range": [25, 28]},
                {"annotation": "Exposition — Pont", "range": [29, 42]},
                {"annotation": "Exposition — Section secondaire", "range": [43, 54]},
                {"annotation": "Exposition — Thème 2 (Chanson du bohémien)", "range": [43, 48]},
                {"annotation": "Exposition — Transition", "range": [48, 54]},
                {"annotation": "Exposition — Coda (Thème du malheur de Wozzeck)", "range": [55, 59]},
                {"annotation": "Première reprise — Section principale", "range": [60, 80]},
                {"annotation": "Première reprise — Pont", "range": [81, 89]},
                {"annotation": "Première reprise — Section secondaire (Thème 2)", "range": [90, 92]},
                {"annotation": "Première reprise — Coda", "range": [93, 95]},
                {"annotation": "Développement — Thème 1", "range": [96, 101]},
                {"annotation": "Développement — Thème du malheur de Wozzeck", "range": [101, 104]},
                {"annotation": "Développement — Thème 1", "range": [105, 108]},
                {"annotation": "Développement — Thème du pont", "range": [109, 123]},
                {"annotation": "Développement — Coda", "range": [124, 127]},
                {"annotation": "Deuxième reprise — Section principale", "range": [128, 149]},
                {"annotation": "Deuxième reprise — Thème 1", "range": [128, 139]},
                {"annotation": "Deuxième reprise — Changement de scène", "range": [141, 149]},
                {"annotation": "Deuxième reprise — Section secondaire (Thème 1 en augmentation)", "range": [150, 161]},
                {"annotation": "Deuxième reprise — Coda (Strette)", "range": [162, 165]},
                {"annotation": "Deuxième reprise — Cadence finale", "range": [165, 166]},
                {"annotation": "Deuxième reprise — Silence", "range": [167, 169]},
            ]
        },
        2: {
            scene_name: "Deuxième mouvement : Fantaisie et Fugue",
            annotations: [
                {"annotation": "Première partie — Invention sur les Sujets I et II", "range": [171, 200]},
                {"annotation": "Valse (Aria) — Ritournelle", "range": [201, 207]},
                {"annotation": "Valse (Aria) — A1", "range": [208, 215]},
                {"annotation": "Valse (Aria) — Ritournelle", "range": [215, 219]},
                {"annotation": "Valse (Aria) — B", "range": [219, 231]},
                {"annotation": "Valse (Aria) — Ritournelle et Transition", "range": [232, 237]},
                {"annotation": "Valse (Aria) — A2", "range": [238, 244]},
                {"annotation": "Valse (Aria) — Ritournelle", "range": [245, 247]},
                {"annotation": "Coda", "range": [248, 272]},
                {"annotation": "Deuxième partie — Présentation chorale du Sujet III", "range": [273, 285]},
                {"annotation": "Fugue — Exposition du Sujet I", "range": [286, 292]},
                {"annotation": "Fugue — Exposition du Sujet II", "range": [293, 296]},
                {"annotation": "Fugue — Première section du Développement (Sujets I et II)", "range": [297, 312]},
                {"annotation": "Fugue — Exposition du Sujet III", "range": [313, 316]},
                {"annotation": "Fugue — Deuxième section du Développement (Sujets I et III)", "range": [317, 334]},
                {"annotation": "Fugue — Troisième section du Développement (Sujets I, II et III)", "range": [335, 341]},
                {"annotation": "Fugue — Coda", "range": [341, 345]},
                {"annotation": "Fugue — Coda", "range": [345, 362]},
                {"annotation": "Interlude — Changement de scène (Orchestre de chambre)", "range": [366, 371]},
            ]
        },
        3: {
            scene_name: "Troisième mouvement : Largo",
            annotations: [
                {"annotation": "A1 (Orchestre de chambre)", "range": [371, 387]},
                {"annotation": "B (Orchestre de chambre et orchestre symphonique)", "range": [387, 397]},
                {"annotation": "A2a (Orchestre de chambre)", "range": [398, 401]},
                {"annotation": "A2b (Orchestre de chambre et orchestre symphonique)", "range": [402, 405]},
                {"annotation": "Interlude et Fermeture du rideau", "range": [406, 411]},
            ]
        },
        4: {
            scene_name: "Quatrième mouvement : Scherzo",
            annotations: [
                {"annotation": "Scherzo I — A1", "range": [412, 429]},
                {"annotation": "Scherzo I — B", "range": [430, 438]},
                {"annotation": "Scherzo I — A2", "range": [439, 455]},
                {"annotation": "Trio I — Choral, Strophe I", "range": [456, 464]},
                {"annotation": "Trio I — Choral, Strophe II", "range": [465, 480]},
                {"annotation": "Scherzo II — Section 1", "range": [481, 495]},
                {"annotation": "Scherzo II — Section 2", "range": [496, 503]},
                {"annotation": "Scherzo II — Section 3", "range": [504, 513]},
                {"annotation": "Scherzo II — Section 4", "range": [514, 528]},
                {"annotation": "Scherzo II — Section 5", "range": [529, 538]},
                {"annotation": "Scherzo II — Section 6", "range": [539, 545]},
                {"annotation": "Scherzo II — Section 7", "range": [546, 560]},
                {"annotation": "Trio II — A1 : Chœur de chasse", "range": [561, 577]},
                {"annotation": "Trio II — Chanson d'Andres", "range": [577, 580]},
                {"annotation": "Trio II — A2 : Chœur de chasse", "range": [581, 591]},
                {"annotation": "Scherzo I (quasi reprise) — A", "range": [592, 602]},
                {"annotation": "Scherzo I (quasi reprise) — B", "range": [602, 604]},
                {"annotation": "Trio I (quasi reprise) — Variation de choral", "range": [605, 633]},
                {"annotation": "Trio I (quasi reprise) — Transition (Orchestre symphonique)", "range": [634, 649]},
                {"annotation": "Trio I (quasi reprise) — Transition (Orchestre de chambre — le Fou)", "range": [650, 669]},
                {"annotation": "Scherzo II (quasi reprise)", "range": [671, 684]},
                {"annotation": "Interlude symphonique — Changement de scène", "range": [685, 736]},
            ]
        },
        5: {
            scene_name: "Cinquième mouvement : Introduction et Rondo",
            annotations: [
                {"annotation": "Introduction", "range": [737, 760]},
                {"annotation": "Rondo marziale — A1 (Premier refrain)", "range": [761, 768]},
                {"annotation": "Rondo marziale — A2", "range": [768, 775]},
                {"annotation": "Rondo marziale — B1", "range": [776, 785]},
                {"annotation": "Rondo marziale — A3 (Deuxième refrain)", "range": [785, 788]},
                {"annotation": "Rondo marziale — C", "range": [789, 799]},
                {"annotation": "Rondo marziale — B2", "range": [800, 804]},
                {"annotation": "Rondo marziale — A4", "range": [805, 814]},
                {"annotation": "Rondo marziale — Silence", "range": [815, 818]},
            ]
        }
    },
    3: {
        1: {
            scene_name: "Première scène : Invention sur un Thème",
            annotations: [
                {"annotation": "Silence (Ouverture du rideau)", "range": [1, 2]},
                {"annotation": "Thème", "range": [3, 9]},
                {"annotation": "Variation 1", "range": [10, 16]},
                {"annotation": "Variation 2", "range": [17, 18]},
                {"annotation": "Variation 3", "range": [19, 25]},
                {"annotation": "Variation 4", "range": [26, 32]},
                {"annotation": "Variation 5", "range": [33, 39]},
                {"annotation": "Variation 6", "range": [40, 44]},
                {"annotation": "Variation 7", "range": [45, 51]},
                {"annotation": "Fugue — Exposition — Sujet I", "range": [52, 57]},
                {"annotation": "Fugue — Exposition — Sujet II", "range": [57, 62]},
                {"annotation": "Fugue — Strette", "range": [62, 64]},
                {"annotation": "Fugue — Changement de scène", "range": [64, 70]},
                {"annotation": "Codetta", "range": [71, 72]},
            ]
        },
        2: {
            scene_name: "Deuxième scène : Invention sur une note",
            annotations: [
                {"annotation": "Section 1", "range": [73, 76]},
                {"annotation": "Section 2", "range": [77, 80]},
                {"annotation": "Section 3", "range": [80, 85]},
                {"annotation": "Section 4", "range": [86, 91]},
                {"annotation": "Section 5", "range": [92, 96]},
                {"annotation": "Section 6", "range": [97, 108]},
                {"annotation": "Interlude — Changement de scène", "range": [109, 121]},
            ]
        },
        3: {
            scene_name: "Troisième scène : Invention sur un rythme",
            annotations: [
                {"annotation": "Polka", "range": [122, 144]},
                {"annotation": "Chanson de Wozzeck et reprise de la Polka", "range": [145, 168]},
                {"annotation": "Chanson de Margret", "range": [168, 179]},
                {"annotation": "Canon rythmique", "range": [180, 186]},
                {"annotation": "Strette", "range": [186, 212]},
                {"annotation": "Interlude — Changement de scène", "range": [212, 219]},
            ]
        },
        4: {
            scene_name: "Quatrième scène : Invention sur un accord de six sons",
            annotations: [
                {"annotation": "Section 1", "range": [220, 256]},
                {"annotation": "Section 2", "range": [257, 284]},
                {"annotation": "Section 3", "range": [284, 301]},
                {"annotation": "Section 4", "range": [301, 319]},
                {"annotation": "Interlude en Ré mineur — Changement de scène", "range": [320, 371]},
            ]
        },
        5: {
            scene_name: "Cinquième scène : Invention sur un mouvement perpétuel de croches",
            annotations: [
                {"annotation": "Section 1 : Ronde enfantine", "range": [371, 375]},
                {"annotation": "Section 2 : Dialogue parlé des enfants", "range": [375, 379]},
                {"annotation": "Section 3 : L'enfant de Marie", "range": [380, 388]},
                {"annotation": "Coda", "range": [388, 392]},
            ]
        }
    }
};
