export type LanguageCode = "en" | "fr";

export const text = {
    'en' : {
        ACT: 'act',
        ACTS: 'acts',
        SCENE: 'scene',
        SCENES: 'scenes',
        SCENE_STRUCTURE: 'measures',
        BAR: 'bar',
        BARS: 'bars',
        BEAT: 'beat',
        PREV_BAR: 'previous bar',
        NEXT_BAR: 'next bar',
        PREV_PAGE: 'previous page',
        NEXT_PAGE: 'next page',
        TITLE: '<i>Wozzeck</i> Annotated Score',
        BYLINE: 'By Arden Butterfield, François-Hugues Leclair, and Matthieu Galliker',
        ANNOTATIONS: 'Annotations',
        TIMELINES: 'Temporal Structure',
        VIDEO_PLAYER: 'Video Player',
        PAGE: 'page',
        INFO: 'info',
        CLOSE: 'close',
        THEME_LIGHT: 'light mode',
        THEME_DARK: 'dark mode',
        SEARCH_PLACEHOLDER: 'Search annotations…'
    },
    'fr' : {
        ACT: 'acte',
        ACTS: 'actes',
        SCENE: 'scène',
        SCENES: 'scenes',
        SCENE_STRUCTURE: 'mesures',
        BAR: 'mesure',
        BARS: 'mesures',
        BEAT: 'temps',
        PREV_BAR: 'mesure précédente',
        NEXT_BAR: 'mesure suivante',
        PREV_PAGE: 'page précédente',
        NEXT_PAGE: 'page suivante',
        TITLE: 'Partition annotée de <i>Wozzeck</i>',
        BYLINE: 'Par Arden Butterfield, François-Hugues Leclair et Matthieu Galliker',
        ANNOTATIONS: 'Annotations',
        TIMELINES: 'Structure temporelle',
        VIDEO_PLAYER: 'Lecteur vidéo',
        PAGE: 'page',
        INFO: 'infos',
        CLOSE: 'annuler',
        THEME_LIGHT: 'mode clair',
        THEME_DARK: 'mode sombre',
        SEARCH_PLACEHOLDER: 'Rechercher des annotations…'
    }
}

export const capitalizeFirstLetter = <T extends string>(s: T) =>
    (s[0].toUpperCase() + s.slice(1)) as Capitalize<typeof s>;