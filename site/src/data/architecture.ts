import { MultiLanguageString } from "./text";

export interface SectionAnnotation {
    annotation: MultiLanguageString,
    range: [number, number]
}

export interface SceneArchitecture {
    [sceneNumber: number] : {
        scene_name: MultiLanguageString,
        annotations: Array<SectionAnnotation>
    }
}

export interface Architecture {
    [actNumber : number] : SceneArchitecture
}

export const architecture : Architecture = {
    1: {
        1: {
            scene_name: {fr: "Première Scène : Suite", en: "First Scene: Suite", pt: "Primeira Cena: Suite", de: "Erste Szene: Suite"},
            annotations: [
                {annotation: {fr: "Prélude", en: "Prelude", pt: "Prelúdio", de: "Präludium"}, range: [1, 29]},
                {annotation: {fr: "Pavane", en: "Pavane", pt: "Pavana", de: "Pavane"}, range: [30, 50]},
                {annotation: {fr: "Cadenza pour alto seul", en: "Cadenza for Solo Viola", pt: "Cadenza para viola solo", de: "Kadenz für Solobratsche"}, range: [51, 64]},
                {annotation: {fr: "Gigue", en: "Gigue", pt: "Giga", de: "Gigue"}, range: [65, 108]},
                {annotation: {fr: "Cadenza pour contrebasson", en: "Cadenza for Contrabassoon", pt: "Cadenza para contrafagote", de: "Kadenz für Kontrafagott"}, range: [109, 114]},
                {annotation: {fr: "Quasi Gavotte", en: "Quasi Gavotte", pt: "Quasi Gavota", de: "Quasi Gavotte"}, range: [115, 136]},
                {annotation: {fr: "Air", en: "Air", pt: "Air", de: "Air"}, range: [136, 153]},
                {annotation: {fr: "Coda", en: "Coda", pt: "Coda", de: "Coda"}, range: [153, 171]},
                {annotation: {fr: "Rideau", en: "Curtain", pt: "Pano", de: "Vorhang"}, range: [172, 172]},
                {annotation: {fr: "Interlude orchestral — Changement de scène", en: "Orchestral Interlude — Scene Change", pt: "Interlúdio orquestral — Mudança de cena", de: "Orchesterzwischenspiel — Szenenwechsel"}, range: [173, 200]},
            ]
        },
        2: {
            scene_name: {fr: "Deuxième Scène : Rhapsodie sur trois accords — Chant de chasseur en trois strophes", en: "Second Scene: Rhapsody on Three Chords — Hunter's Song in Three Strophes", pt: "Segunda Cena: Rapsódia sobre três acordes — Canção de caçador em três estrofes", de: "Zweite Szene: Rhapsodie über drei Akkorde — Jägerlied in drei Strophen"},
            annotations: [
                {annotation: {fr: "Rhapsodie", en: "Rhapsody", pt: "Rapsódia", de: "Rhapsodie"}, range: [201, 211]},
                {annotation: {fr: "Chant de chasseur — 1ère strophe", en: "Hunter's Song — 1st Strophe", pt: "Canção de caçador — 1ª estrofe", de: "Jägerlied — 1. Strophe"}, range: [212, 222]},
                {annotation: {fr: "Rhapsodie", en: "Rhapsody", pt: "Rapsódia", de: "Rhapsodie"}, range: [223, 248]},
                {annotation: {fr: "Chant de chasseur — 2ième strophe", en: "Hunter's Song — 2nd Strophe", pt: "Canção de caçador — 2ª estrofe", de: "Jägerlied — 2. Strophe"}, range: [249, 256]},
                {annotation: {fr: "Rhapsodie et Chant de chasseur — 3ième strophe", en: "Rhapsody and Hunter's Song — 3rd Strophe", pt: "Rapsódia e Canção de caçador — 3ª estrofe", de: "Rhapsodie und Jägerlied — 3. Strophe"}, range: [257, 270]},
                {annotation: {fr: "Cataclysme", en: "Cataclysm", pt: "Cataclismo", de: "Kataklysmus"}, range: [271, 299]},
                {annotation: {fr: "Coda", en: "Coda", pt: "Coda", de: "Coda"}, range: [300, 310]},
                {annotation: {fr: "Interlude orchestral — Changement de scène", en: "Orchestral Interlude — Scene Change", pt: "Interlúdio orquestral — Mudança de cena", de: "Orchesterzwischenspiel — Szenenwechsel"}, range: [311, 325]},
                {annotation: {fr: "Approche de la musique militaire", en: "Approach of the Military Music", pt: "Aproximação da música militar", de: "Annäherung der Militärmusik"}, range: [326, 327]},
                {annotation: {fr: "Levée du rideau", en: "Curtain Rise", pt: "Subida do pano", de: "Vorhangaufzug"}, range: [328, 329]},
            ]
        },
        3: {
            scene_name: {fr: "Troisième Scène : Marche militaire et berceuse", en: "Third Scene: Military March and Lullaby", pt: "Terceira Cena: Marcha militar e canção de ninar", de: "Dritte Szene: Militärmarsch und Wiegenlied"},
            annotations: [
                {annotation: {fr: "Introduction", en: "Introduction", pt: "Introdução", de: "Einleitung"}, range: [330, 333]},
                {annotation: {fr: "Marche militaire", en: "Military March", pt: "Marcha militar", de: "Militärmarsch"}, range: [334, 345]},
                {annotation: {fr: "Quasi Trio", en: "Quasi Trio", pt: "Quasi Trio", de: "Quasi Trio"}, range: [346, 362]},
                {annotation: {fr: "Introduction à la berceuse", en: "Introduction to the Lullaby", pt: "Introdução à canção de ninar", de: "Einleitung zum Wiegenlied"}, range: [363, 371]},
                {annotation: {fr: "Berceuse — Premier couplet", en: "Lullaby — First Verse", pt: "Canção de ninar — Primeira estrofe", de: "Wiegenlied — Erste Strophe"}, range: [372, 379]},
                {annotation: {fr: "Berceuse — Refrain", en: "Lullaby — Refrain", pt: "Canção de ninar — Refrão", de: "Wiegenlied — Refrain"}, range: [380, 387]},
                {annotation: {fr: "Berceuse — Deuxième couplet", en: "Lullaby — Second Verse", pt: "Canção de ninar — Segunda estrofe", de: "Wiegenlied — Zweite Strophe"}, range: [388, 395]},
                {annotation: {fr: "Berceuse — Refrain", en: "Lullaby — Refrain", pt: "Canção de ninar — Refrão", de: "Wiegenlied — Refrain"}, range: [396, 416]},
                {annotation: {fr: "Coda de la berceuse", en: "Coda of the Lullaby", pt: "Coda da canção de ninar", de: "Coda des Wiegenlieds"}, range: [417, 424]},
                {annotation: {fr: "Arrivée de Wozzeck — Épisode durchkomponiert", en: "Arrival of Wozzeck — Through-composed Episode", pt: "Chegada de Wozzeck — Episódio durchkomponiert", de: "Ankunft Wozzecks — Durchkomponierte Episode"}, range: [425, 472]},
                {annotation: {fr: "Interlude orchestral — Changement de scène", en: "Orchestral Interlude — Scene Change", pt: "Interlúdio orquestral — Mudança de cena", de: "Orchesterzwischenspiel — Szenenwechsel"}, range: [473, 487]},
            ]
        },
        4: {
            scene_name: {fr: "Quatrième Scène : Passacaille", en: "Fourth Scene: Passacaglia", pt: "Quarta Cena: Passacália", de: "Vierte Szene: Passacaglia"},
            annotations: [
                {annotation: {fr: "Thème", en: "Theme", pt: "Tema", de: "Thema"}, range: [488, 495]},
                {annotation: {fr: "Variation 1", en: "Variation 1", pt: "Variação 1", de: "Variation 1"}, range: [496, 502]},
                {annotation: {fr: "Variation 2", en: "Variation 2", pt: "Variação 2", de: "Variation 2"}, range: [503, 509]},
                {annotation: {fr: "Variation 3", en: "Variation 3", pt: "Variação 3", de: "Variation 3"}, range: [510, 516]},
                {annotation: {fr: "Variation 4", en: "Variation 4", pt: "Variação 4", de: "Variation 4"}, range: [517, 523]},
                {annotation: {fr: "Variation 5", en: "Variation 5", pt: "Variação 5", de: "Variation 5"}, range: [524, 530]},
                {annotation: {fr: "Variation 6", en: "Variation 6", pt: "Variação 6", de: "Variation 6"}, range: [531, 537]},
                {annotation: {fr: "Variation 7", en: "Variation 7", pt: "Variação 7", de: "Variation 7"}, range: [538, 538]},
                {annotation: {fr: "Variation 8", en: "Variation 8", pt: "Variação 8", de: "Variation 8"}, range: [539, 545]},
                {annotation: {fr: "Variation 9", en: "Variation 9", pt: "Variação 9", de: "Variation 9"}, range: [546, 552]},
                {annotation: {fr: "Variation 10", en: "Variation 10", pt: "Variação 10", de: "Variation 10"}, range: [553, 553]},
                {annotation: {fr: "Variation 11", en: "Variation 11", pt: "Variação 11", de: "Variation 11"}, range: [554, 560]},
                {annotation: {fr: "Variation 12", en: "Variation 12", pt: "Variação 12", de: "Variation 12"}, range: [561, 561]},
                {annotation: {fr: "Variation 13", en: "Variation 13", pt: "Variação 13", de: "Variation 13"}, range: [562, 568]},
                {annotation: {fr: "Variation 14", en: "Variation 14", pt: "Variação 14", de: "Variation 14"}, range: [569, 575]},
                {annotation: {fr: "Variation 15", en: "Variation 15", pt: "Variação 15", de: "Variation 15"}, range: [576, 582]},
                {annotation: {fr: "Variation 16", en: "Variation 16", pt: "Variação 16", de: "Variation 16"}, range: [583, 589]},
                {annotation: {fr: "Variation 17", en: "Variation 17", pt: "Variação 17", de: "Variation 17"}, range: [590, 596]},
                {annotation: {fr: "Variation 18", en: "Variation 18", pt: "Variação 18", de: "Variation 18"}, range: [597, 610]},
                {annotation: {fr: "Variation 19", en: "Variation 19", pt: "Variação 19", de: "Variation 19"}, range: [611, 619]},
                {annotation: {fr: "Variation 20", en: "Variation 20", pt: "Variação 20", de: "Variation 20"}, range: [620, 637]},
                {annotation: {fr: "Variation 21", en: "Variation 21", pt: "Variação 21", de: "Variation 21"}, range: [638, 645]},
                {annotation: {fr: "Interlude orchestral — Changement de scène (Andante affettuoso)", en: "Orchestral Interlude — Scene Change (Andante affettuoso)", pt: "Interlúdio orquestral — Mudança de cena (Andante affettuoso)", de: "Orchesterzwischenspiel — Szenenwechsel (Andante affettuoso)"}, range: [656, 665]},
            ]
        },
        5: {
            scene_name: {fr: "Cinquième Scène : Quasi Rondo", en: "Fifth Scene: Quasi Rondo", pt: "Quinta Cena: Quasi Rondo", de: "Fünfte Szene: Quasi Rondo"},
            annotations: [
                {annotation: {fr: "Section 1", en: "Section 1", pt: "Seção 1", de: "Abschnitt 1"}, range: [666, 676]},
                {annotation: {fr: "Section 2", en: "Section 2", pt: "Seção 2", de: "Abschnitt 2"}, range: [677, 685]},
                {annotation: {fr: "Section 3", en: "Section 3", pt: "Seção 3", de: "Abschnitt 3"}, range: [686, 693]},
                {annotation: {fr: "Section 4", en: "Section 4", pt: "Seção 4", de: "Abschnitt 4"}, range: [693, 698]},
                {annotation: {fr: "Pause", en: "Pause", pt: "Pausa", de: "Pause"}, range: [699, 699]},
                {annotation: {fr: "Section 5", en: "Section 5", pt: "Seção 5", de: "Abschnitt 5"}, range: [700, 701]},
                {annotation: {fr: "Section 6", en: "Section 6", pt: "Seção 6", de: "Abschnitt 6"}, range: [702, 709]},
                {annotation: {fr: "Section 7", en: "Section 7", pt: "Seção 7", de: "Abschnitt 7"}, range: [709, 715]},
            ]
        }
    },
    2: {
        1: {
            scene_name: {fr: "Premier mouvement : Sonate", en: "First Movement: Sonata", pt: "Primeiro movimento: Sonata", de: "Erster Satz: Sonate"},
            annotations: [
                {annotation: {fr: "Introduction", en: "Introduction", pt: "Introdução", de: "Einleitung"}, range: [1, 6]},
                {annotation: {fr: "Exposition — Section principale", en: "Exposition — Main Section", pt: "Exposição — Seção principal", de: "Exposition — Hauptabschnitt"}, range: [7, 28]},
                {annotation: {fr: "Exposition — Thème 1 (Boucles d'oreilles)", en: "Exposition — Theme 1 (Earrings)", pt: "Exposição — Tema 1 (Brincos)", de: "Exposition — Thema 1 (Ohrringe)"}, range: [7, 24]},
                {annotation: {fr: "Exposition — Transition", en: "Exposition — Transition", pt: "Exposição — Transição", de: "Exposition — Übergang"}, range: [25, 28]},
                {annotation: {fr: "Exposition — Pont", en: "Exposition — Bridge", pt: "Exposição — Ponte", de: "Exposition — Überleitung"}, range: [29, 42]},
                {annotation: {fr: "Exposition — Section secondaire", en: "Exposition — Secondary Section", pt: "Exposição — Seção secundária", de: "Exposition — Nebenabschnitt"}, range: [43, 54]},
                {annotation: {fr: "Exposition — Thème 2 (Chanson du bohémien)", en: "Exposition — Theme 2 (Gypsy Song)", pt: "Exposição — Tema 2 (Canção do cigano)", de: "Exposition — Thema 2 (Zigeunerlied)"}, range: [43, 48]},
                {annotation: {fr: "Exposition — Transition", en: "Exposition — Transition", pt: "Exposição — Transição", de: "Exposition — Übergang"}, range: [48, 54]},
                {annotation: {fr: "Exposition — Coda (Thème du malheur de Wozzeck)", en: "Exposition — Coda (Theme of Wozzeck's Misfortune)", pt: "Exposição — Coda (Tema do infortúnio de Wozzeck)", de: "Exposition — Coda (Thema von Wozzecks Unglück)"}, range: [55, 59]},
                {annotation: {fr: "Première reprise — Section principale", en: "First Reprise — Main Section", pt: "Primeira reapresentação — Seção principal", de: "Erste Reprise — Hauptabschnitt"}, range: [60, 80]},
                {annotation: {fr: "Première reprise — Pont", en: "First Reprise — Bridge", pt: "Primeira reapresentação — Ponte", de: "Erste Reprise — Überleitung"}, range: [81, 89]},
                {annotation: {fr: "Première reprise — Section secondaire (Thème 2)", en: "First Reprise — Secondary Section (Theme 2)", pt: "Primeira reapresentação — Seção secundária (Tema 2)", de: "Erste Reprise — Nebenabschnitt (Thema 2)"}, range: [90, 92]},
                {annotation: {fr: "Première reprise — Coda", en: "First Reprise — Coda", pt: "Primeira reapresentação — Coda", de: "Erste Reprise — Coda"}, range: [93, 95]},
                {annotation: {fr: "Développement — Thème 1", en: "Development — Theme 1", pt: "Desenvolvimento — Tema 1", de: "Durchführung — Thema 1"}, range: [96, 101]},
                {annotation: {fr: "Développement — Thème du malheur de Wozzeck", en: "Development — Theme of Wozzeck's Misfortune", pt: "Desenvolvimento — Tema do infortúnio de Wozzeck", de: "Durchführung — Thema von Wozzecks Unglück"}, range: [101, 104]},
                {annotation: {fr: "Développement — Thème 1", en: "Development — Theme 1", pt: "Desenvolvimento — Tema 1", de: "Durchführung — Thema 1"}, range: [105, 108]},
                {annotation: {fr: "Développement — Thème du pont", en: "Development — Bridge Theme", pt: "Desenvolvimento — Tema da ponte", de: "Durchführung — Übergangsthema"}, range: [109, 123]},
                {annotation: {fr: "Développement — Coda", en: "Development — Coda", pt: "Desenvolvimento — Coda", de: "Durchführung — Coda"}, range: [124, 127]},
                {annotation: {fr: "Deuxième reprise — Section principale", en: "Second Reprise — Main Section", pt: "Segunda reapresentação — Seção principal", de: "Zweite Reprise — Hauptabschnitt"}, range: [128, 149]},
                {annotation: {fr: "Deuxième reprise — Thème 1", en: "Second Reprise — Theme 1", pt: "Segunda reapresentação — Tema 1", de: "Zweite Reprise — Thema 1"}, range: [128, 139]},
                {annotation: {fr: "Deuxième reprise — Changement de scène", en: "Second Reprise — Scene Change", pt: "Segunda reapresentação — Mudança de cena", de: "Zweite Reprise — Szenenwechsel"}, range: [141, 149]},
                {annotation: {fr: "Deuxième reprise — Section secondaire (Thème 1 en augmentation)", en: "Second Reprise — Secondary Section (Theme 1 in Augmentation)", pt: "Segunda reapresentação — Seção secundária (Tema 1 em aumentação)", de: "Zweite Reprise — Nebenabschnitt (Thema 1 in Augmentation)"}, range: [150, 161]},
                {annotation: {fr: "Deuxième reprise — Coda (Strette)", en: "Second Reprise — Coda (Stretto)", pt: "Segunda reapresentação — Coda (Strette)", de: "Zweite Reprise — Coda (Strette)"}, range: [162, 165]},
                {annotation: {fr: "Deuxième reprise — Cadence finale", en: "Second Reprise — Final Cadence", pt: "Segunda reapresentação — Cadência final", de: "Zweite Reprise — Schlusskadenz"}, range: [165, 166]},
                {annotation: {fr: "Deuxième reprise — Silence", en: "Second Reprise — Silence", pt: "Segunda reapresentação — Silêncio", de: "Zweite Reprise — Stille"}, range: [167, 169]},
            ]
        },
        2: {
            scene_name: {fr: "Deuxième mouvement : Fantaisie et Fugue", en: "Second Movement: Fantasy and Fugue", pt: "Segundo movimento: Fantasia e Fuga", de: "Zweiter Satz: Fantasie und Fuge"},
            annotations: [
                {annotation: {fr: "Première partie — Invention sur les Sujets I et II", en: "First Part — Invention on Subjects I and II", pt: "Primeira parte — Invenção sobre os Sujeitos I e II", de: "Erster Teil — Invention über die Themen I und II"}, range: [171, 200]},
                {annotation: {fr: "Valse (Aria) — Ritournelle", en: "Waltz (Aria) — Ritornello", pt: "Valsa (Ária) — Ritornello", de: "Walzer (Arie) — Ritornell"}, range: [201, 207]},
                {annotation: {fr: "Valse (Aria) — A1", en: "Waltz (Aria) — A1", pt: "Valsa (Ária) — A1", de: "Walzer (Arie) — A1"}, range: [208, 215]},
                {annotation: {fr: "Valse (Aria) — Ritournelle", en: "Waltz (Aria) — Ritornello", pt: "Valsa (Ária) — Ritornello", de: "Walzer (Arie) — Ritornell"}, range: [215, 219]},
                {annotation: {fr: "Valse (Aria) — B", en: "Waltz (Aria) — B", pt: "Valsa (Ária) — B", de: "Walzer (Arie) — B"}, range: [219, 231]},
                {annotation: {fr: "Valse (Aria) — Ritournelle et Transition", en: "Waltz (Aria) — Ritornello and Transition", pt: "Valsa (Ária) — Ritornello e Transição", de: "Walzer (Arie) — Ritornell und Übergang"}, range: [232, 237]},
                {annotation: {fr: "Valse (Aria) — A2", en: "Waltz (Aria) — A2", pt: "Valsa (Ária) — A2", de: "Walzer (Arie) — A2"}, range: [238, 244]},
                {annotation: {fr: "Valse (Aria) — Ritournelle", en: "Waltz (Aria) — Ritornello", pt: "Valsa (Ária) — Ritornello", de: "Walzer (Arie) — Ritornell"}, range: [245, 247]},
                {annotation: {fr: "Coda", en: "Coda", pt: "Coda", de: "Coda"}, range: [248, 272]},
                {annotation: {fr: "Deuxième partie — Présentation chorale du Sujet III", en: "Second Part — Choral Presentation of Subject III", pt: "Segunda parte — Apresentação coral do Sujeito III", de: "Zweiter Teil — Chorale Präsentation des Themas III"}, range: [273, 285]},
                {annotation: {fr: "Fugue — Exposition du Sujet I", en: "Fugue — Exposition of Subject I", pt: "Fuga — Exposição do Sujeito I", de: "Fuge — Exposition des Themas I"}, range: [286, 292]},
                {annotation: {fr: "Fugue — Exposition du Sujet II", en: "Fugue — Exposition of Subject II", pt: "Fuga — Exposição do Sujeito II", de: "Fuge — Exposition des Themas II"}, range: [293, 296]},
                {annotation: {fr: "Fugue — Première section du Développement (Sujets I et II)", en: "Fugue — First Development Section (Subjects I and II)", pt: "Fuga — Primeira seção do Desenvolvimento (Sujeitos I e II)", de: "Fuge — Erster Durchführungsabschnitt (Themen I und II)"}, range: [297, 312]},
                {annotation: {fr: "Fugue — Exposition du Sujet III", en: "Fugue — Exposition of Subject III", pt: "Fuga — Exposição do Sujeito III", de: "Fuge — Exposition des Themas III"}, range: [313, 316]},
                {annotation: {fr: "Fugue — Deuxième section du Développement (Sujets I et III)", en: "Fugue — Second Development Section (Subjects I and III)", pt: "Fuga — Segunda seção do Desenvolvimento (Sujeitos I e III)", de: "Fuge — Zweiter Durchführungsabschnitt (Themen I und III)"}, range: [317, 334]},
                {annotation: {fr: "Fugue — Troisième section du Développement (Sujets I, II et III)", en: "Fugue — Third Development Section (Subjects I, II and III)", pt: "Fuga — Terceira seção do Desenvolvimento (Sujeitos I, II e III)", de: "Fuge — Dritter Durchführungsabschnitt (Themen I, II und III)"}, range: [335, 341]},
                {annotation: {fr: "Fugue — Coda", en: "Fugue — Coda", pt: "Fuga — Coda", de: "Fuge — Coda"}, range: [341, 345]},
                {annotation: {fr: "Fugue — Coda", en: "Fugue — Coda", pt: "Fuga — Coda", de: "Fuge — Coda"}, range: [345, 362]},
                {annotation: {fr: "Interlude — Changement de scène (Orchestre de chambre)", en: "Interlude — Scene Change (Chamber Orchestra)", pt: "Interlúdio — Mudança de cena (Orquestra de câmara)", de: "Zwischenspiel — Szenenwechsel (Kammerorchester)"}, range: [366, 371]},
            ]
        },
        3: {
            scene_name: {fr: "Troisième mouvement : Largo", en: "Third Movement: Largo", pt: "Terceiro movimento: Largo", de: "Dritter Satz: Largo"},
            annotations: [
                {annotation: {fr: "A1 (Orchestre de chambre)", en: "A1 (Chamber Orchestra)", pt: "A1 (Orquestra de câmara)", de: "A1 (Kammerorchester)"}, range: [371, 387]},
                {annotation: {fr: "B (Orchestre de chambre et orchestre symphonique)", en: "B (Chamber Orchestra and Symphony Orchestra)", pt: "B (Orquestra de câmara e orquestra sinfônica)", de: "B (Kammerorchester und Sinfonieorchester)"}, range: [387, 397]},
                {annotation: {fr: "A2a (Orchestre de chambre)", en: "A2a (Chamber Orchestra)", pt: "A2a (Orquestra de câmara)", de: "A2a (Kammerorchester)"}, range: [398, 401]},
                {annotation: {fr: "A2b (Orchestre de chambre et orchestre symphonique)", en: "A2b (Chamber Orchestra and Symphony Orchestra)", pt: "A2b (Orquestra de câmara e orquestra sinfônica)", de: "A2b (Kammerorchester und Sinfonieorchester)"}, range: [402, 405]},
                {annotation: {fr: "Interlude et Fermeture du rideau", en: "Interlude and Curtain Fall", pt: "Interlúdio e Descida do pano", de: "Zwischenspiel und Vorhangfall"}, range: [406, 411]},
            ]
        },
        4: {
            scene_name: {fr: "Quatrième mouvement : Scherzo", en: "Fourth Movement: Scherzo", pt: "Quarto movimento: Scherzo", de: "Vierter Satz: Scherzo"},
            annotations: [
                {annotation: {fr: "Scherzo I — A1", en: "Scherzo I — A1", pt: "Scherzo I — A1", de: "Scherzo I — A1"}, range: [412, 429]},
                {annotation: {fr: "Scherzo I — B", en: "Scherzo I — B", pt: "Scherzo I — B", de: "Scherzo I — B"}, range: [430, 438]},
                {annotation: {fr: "Scherzo I — A2", en: "Scherzo I — A2", pt: "Scherzo I — A2", de: "Scherzo I — A2"}, range: [439, 455]},
                {annotation: {fr: "Trio I — Choral, Strophe I", en: "Trio I — Chorale, Strophe I", pt: "Trio I — Coral, Estrofe I", de: "Trio I — Choral, Strophe I"}, range: [456, 464]},
                {annotation: {fr: "Trio I — Choral, Strophe II", en: "Trio I — Chorale, Strophe II", pt: "Trio I — Coral, Estrofe II", de: "Trio I — Choral, Strophe II"}, range: [465, 480]},
                {annotation: {fr: "Scherzo II — Section 1", en: "Scherzo II — Section 1", pt: "Scherzo II — Seção 1", de: "Scherzo II — Abschnitt 1"}, range: [481, 495]},
                {annotation: {fr: "Scherzo II — Section 2", en: "Scherzo II — Section 2", pt: "Scherzo II — Seção 2", de: "Scherzo II — Abschnitt 2"}, range: [496, 503]},
                {annotation: {fr: "Scherzo II — Section 3", en: "Scherzo II — Section 3", pt: "Scherzo II — Seção 3", de: "Scherzo II — Abschnitt 3"}, range: [504, 513]},
                {annotation: {fr: "Scherzo II — Section 4", en: "Scherzo II — Section 4", pt: "Scherzo II — Seção 4", de: "Scherzo II — Abschnitt 4"}, range: [514, 528]},
                {annotation: {fr: "Scherzo II — Section 5", en: "Scherzo II — Section 5", pt: "Scherzo II — Seção 5", de: "Scherzo II — Abschnitt 5"}, range: [529, 538]},
                {annotation: {fr: "Scherzo II — Section 6", en: "Scherzo II — Section 6", pt: "Scherzo II — Seção 6", de: "Scherzo II — Abschnitt 6"}, range: [539, 545]},
                {annotation: {fr: "Scherzo II — Section 7", en: "Scherzo II — Section 7", pt: "Scherzo II — Seção 7", de: "Scherzo II — Abschnitt 7"}, range: [546, 560]},
                {annotation: {fr: "Trio II — A1 : Chœur de chasse", en: "Trio II — A1: Hunting Chorus", pt: "Trio II — A1: Coro de caça", de: "Trio II — A1: Jagdchor"}, range: [561, 577]},
                {annotation: {fr: "Trio II — Chanson d'Andres", en: "Trio II — Andres's Song", pt: "Trio II — Canção de Andres", de: "Trio II — Andreslied"}, range: [577, 580]},
                {annotation: {fr: "Trio II — A2 : Chœur de chasse", en: "Trio II — A2: Hunting Chorus", pt: "Trio II — A2: Coro de caça", de: "Trio II — A2: Jagdchor"}, range: [581, 591]},
                {annotation: {fr: "Scherzo I (quasi reprise) — A", en: "Scherzo I (quasi reprise) — A", pt: "Scherzo I (quasi reapresentação) — A", de: "Scherzo I (quasi Reprise) — A"}, range: [592, 602]},
                {annotation: {fr: "Scherzo I (quasi reprise) — B", en: "Scherzo I (quasi reprise) — B", pt: "Scherzo I (quasi reapresentação) — B", de: "Scherzo I (quasi Reprise) — B"}, range: [602, 604]},
                {annotation: {fr: "Trio I (quasi reprise) — Variation de choral", en: "Trio I (quasi reprise) — Chorale Variation", pt: "Trio I (quasi reapresentação) — Variação de coral", de: "Trio I (quasi Reprise) — Choralvariation"}, range: [605, 633]},
                {annotation: {fr: "Trio I (quasi reprise) — Transition (Orchestre symphonique)", en: "Trio I (quasi reprise) — Transition (Symphony Orchestra)", pt: "Trio I (quasi reapresentação) — Transição (Orquestra sinfônica)", de: "Trio I (quasi Reprise) — Übergang (Sinfonieorchester)"}, range: [634, 649]},
                {annotation: {fr: "Trio I (quasi reprise) — Transition (Orchestre de chambre — le Fou)", en: "Trio I (quasi reprise) — Transition (Chamber Orchestra — the Fool)", pt: "Trio I (quasi reapresentação) — Transição (Orquestra de câmara — o Louco)", de: "Trio I (quasi Reprise) — Übergang (Kammerorchester — der Narr)"}, range: [650, 669]},
                {annotation: {fr: "Scherzo II (quasi reprise)", en: "Scherzo II (quasi reprise)", pt: "Scherzo II (quasi reapresentação)", de: "Scherzo II (quasi Reprise)"}, range: [671, 684]},
                {annotation: {fr: "Interlude symphonique — Changement de scène", en: "Symphonic Interlude — Scene Change", pt: "Interlúdio sinfônico — Mudança de cena", de: "Sinfonisches Zwischenspiel — Szenenwechsel"}, range: [685, 736]},
            ]
        },
        5: {
            scene_name: {fr: "Cinquième mouvement : Introduction et Rondo", en: "Fifth Movement: Introduction and Rondo", pt: "Quinto movimento: Introdução e Rondo", de: "Fünfter Satz: Introduktion und Rondo"},
            annotations: [
                {annotation: {fr: "Introduction", en: "Introduction", pt: "Introdução", de: "Einleitung"}, range: [737, 760]},
                {annotation: {fr: "Rondo marziale — A1 (Premier refrain)", en: "Rondo marziale — A1 (First Refrain)", pt: "Rondo marziale — A1 (Primeiro refrão)", de: "Rondo marziale — A1 (Erster Refrain)"}, range: [761, 768]},
                {annotation: {fr: "Rondo marziale — A2", en: "Rondo marziale — A2", pt: "Rondo marziale — A2", de: "Rondo marziale — A2"}, range: [768, 775]},
                {annotation: {fr: "Rondo marziale — B1", en: "Rondo marziale — B1", pt: "Rondo marziale — B1", de: "Rondo marziale — B1"}, range: [776, 785]},
                {annotation: {fr: "Rondo marziale — A3 (Deuxième refrain)", en: "Rondo marziale — A3 (Second Refrain)", pt: "Rondo marziale — A3 (Segundo refrão)", de: "Rondo marziale — A3 (Zweiter Refrain)"}, range: [785, 788]},
                {annotation: {fr: "Rondo marziale — C", en: "Rondo marziale — C", pt: "Rondo marziale — C", de: "Rondo marziale — C"}, range: [789, 799]},
                {annotation: {fr: "Rondo marziale — B2", en: "Rondo marziale — B2", pt: "Rondo marziale — B2", de: "Rondo marziale — B2"}, range: [800, 804]},
                {annotation: {fr: "Rondo marziale — A4", en: "Rondo marziale — A4", pt: "Rondo marziale — A4", de: "Rondo marziale — A4"}, range: [805, 814]},
                {annotation: {fr: "Rondo marziale — Silence", en: "Rondo marziale — Silence", pt: "Rondo marziale — Silêncio", de: "Rondo marziale — Stille"}, range: [815, 818]},
            ]
        }
    },
    3: {
        1: {
            scene_name: {fr: "Première scène : Invention sur un Thème", en: "First Scene: Invention on a Theme", pt: "Primeira cena: Invenção sobre um Tema", de: "Erste Szene: Invention über ein Thema"},
            annotations: [
                {annotation: {fr: "Silence (Ouverture du rideau)", en: "Silence (Curtain Rise)", pt: "Silêncio (Subida do pano)", de: "Stille (Vorhangaufzug)"}, range: [1, 2]},
                {annotation: {fr: "Thème", en: "Theme", pt: "Tema", de: "Thema"}, range: [3, 9]},
                {annotation: {fr: "Variation 1", en: "Variation 1", pt: "Variação 1", de: "Variation 1"}, range: [10, 16]},
                {annotation: {fr: "Variation 2", en: "Variation 2", pt: "Variação 2", de: "Variation 2"}, range: [17, 18]},
                {annotation: {fr: "Variation 3", en: "Variation 3", pt: "Variação 3", de: "Variation 3"}, range: [19, 25]},
                {annotation: {fr: "Variation 4", en: "Variation 4", pt: "Variação 4", de: "Variation 4"}, range: [26, 32]},
                {annotation: {fr: "Variation 5", en: "Variation 5", pt: "Variação 5", de: "Variation 5"}, range: [33, 39]},
                {annotation: {fr: "Variation 6", en: "Variation 6", pt: "Variação 6", de: "Variation 6"}, range: [40, 44]},
                {annotation: {fr: "Variation 7", en: "Variation 7", pt: "Variação 7", de: "Variation 7"}, range: [45, 51]},
                {annotation: {fr: "Fugue — Exposition — Sujet I", en: "Fugue — Exposition — Subject I", pt: "Fuga — Exposição — Sujeito I", de: "Fuge — Exposition — Thema I"}, range: [52, 57]},
                {annotation: {fr: "Fugue — Exposition — Sujet II", en: "Fugue — Exposition — Subject II", pt: "Fuga — Exposição — Sujeito II", de: "Fuge — Exposition — Thema II"}, range: [57, 62]},
                {annotation: {fr: "Fugue — Strette", en: "Fugue — Stretto", pt: "Fuga — Strette", de: "Fuge — Strette"}, range: [62, 64]},
                {annotation: {fr: "Fugue — Changement de scène", en: "Fugue — Scene Change", pt: "Fuga — Mudança de cena", de: "Fuge — Szenenwechsel"}, range: [64, 70]},
                {annotation: {fr: "Codetta", en: "Codetta", pt: "Codetta", de: "Codetta"}, range: [71, 72]},
            ]
        },
        2: {
            scene_name: {fr: "Deuxième scène : Invention sur une note", en: "Second Scene: Invention on a Note", pt: "Segunda cena: Invenção sobre uma nota", de: "Zweite Szene: Invention über eine Note"},
            annotations: [
                {annotation: {fr: "Section 1", en: "Section 1", pt: "Seção 1", de: "Abschnitt 1"}, range: [73, 76]},
                {annotation: {fr: "Section 2", en: "Section 2", pt: "Seção 2", de: "Abschnitt 2"}, range: [77, 80]},
                {annotation: {fr: "Section 3", en: "Section 3", pt: "Seção 3", de: "Abschnitt 3"}, range: [80, 85]},
                {annotation: {fr: "Section 4", en: "Section 4", pt: "Seção 4", de: "Abschnitt 4"}, range: [86, 91]},
                {annotation: {fr: "Section 5", en: "Section 5", pt: "Seção 5", de: "Abschnitt 5"}, range: [92, 96]},
                {annotation: {fr: "Section 6", en: "Section 6", pt: "Seção 6", de: "Abschnitt 6"}, range: [97, 108]},
                {annotation: {fr: "Interlude — Changement de scène", en: "Interlude — Scene Change", pt: "Interlúdio — Mudança de cena", de: "Zwischenspiel — Szenenwechsel"}, range: [109, 121]},
            ]
        },
        3: {
            scene_name: {fr: "Troisième scène : Invention sur un rythme", en: "Third Scene: Invention on a Rhythm", pt: "Terceira cena: Invenção sobre um ritmo", de: "Dritte Szene: Invention über einen Rhythmus"},
            annotations: [
                {annotation: {fr: "Polka", en: "Polka", pt: "Polka", de: "Polka"}, range: [122, 144]},
                {annotation: {fr: "Chanson de Wozzeck et reprise de la Polka", en: "Wozzeck's Song and Reprise of the Polka", pt: "Canção de Wozzeck e reapresentação da Polka", de: "Wozzecks Lied und Reprise der Polka"}, range: [145, 168]},
                {annotation: {fr: "Chanson de Margret", en: "Margret's Song", pt: "Canção de Margret", de: "Margrets Lied"}, range: [168, 179]},
                {annotation: {fr: "Canon rythmique", en: "Rhythmic Canon", pt: "Cânone rítmico", de: "Rhythmischer Kanon"}, range: [180, 186]},
                {annotation: {fr: "Strette", en: "Stretto", pt: "Strette", de: "Strette"}, range: [186, 212]},
                {annotation: {fr: "Interlude — Changement de scène", en: "Interlude — Scene Change", pt: "Interlúdio — Mudança de cena", de: "Zwischenspiel — Szenenwechsel"}, range: [212, 219]},
            ]
        },
        4: {
            scene_name: {fr: "Quatrième scène : Invention sur un accord de six sons", en: "Fourth Scene: Invention on a Six-Note Chord", pt: "Quarta cena: Invenção sobre um acorde de seis sons", de: "Vierte Szene: Invention über einen Sechstonakkord"},
            annotations: [
                {annotation: {fr: "Section 1", en: "Section 1", pt: "Seção 1", de: "Abschnitt 1"}, range: [220, 256]},
                {annotation: {fr: "Section 2", en: "Section 2", pt: "Seção 2", de: "Abschnitt 2"}, range: [257, 284]},
                {annotation: {fr: "Section 3", en: "Section 3", pt: "Seção 3", de: "Abschnitt 3"}, range: [284, 301]},
                {annotation: {fr: "Section 4", en: "Section 4", pt: "Seção 4", de: "Abschnitt 4"}, range: [301, 319]},
                {annotation: {fr: "Interlude en Ré mineur — Changement de scène", en: "Interlude in D minor — Scene Change", pt: "Interlúdio em Ré menor — Mudança de cena", de: "Zwischenspiel in d-Moll — Szenenwechsel"}, range: [320, 371]},
            ]
        },
        5: {
            scene_name: {fr: "Cinquième scène : Invention sur un mouvement perpétuel de croches", en: "Fifth Scene: Invention on a Perpetual Motion of Eighth Notes", pt: "Quinta cena: Invenção sobre um movimento perpétuo de colcheias", de: "Fünfte Szene: Invention über ein Perpetuum mobile aus Achtelnoten"},
            annotations: [
                {annotation: {fr: "Section 1 : Ronde enfantine", en: "Section 1: Children's Round", pt: "Seção 1: Roda infantil", de: "Abschnitt 1: Kinderrunde"}, range: [371, 375]},
                {annotation: {fr: "Section 2 : Dialogue parlé des enfants", en: "Section 2: Spoken Children's Dialogue", pt: "Seção 2: Diálogo falado das crianças", de: "Abschnitt 2: Gesprochener Kinderdialog"}, range: [375, 379]},
                {annotation: {fr: "Section 3 : L'enfant de Marie", en: "Section 3: Marie's Child", pt: "Seção 3: O filho de Marie", de: "Abschnitt 3: Maries Kind"}, range: [380, 388]},
                {annotation: {fr: "Coda", en: "Coda", pt: "Coda", de: "Coda"}, range: [388, 392]},
            ]
        }
    }
};
