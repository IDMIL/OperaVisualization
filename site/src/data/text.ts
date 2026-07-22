export type LanguageCode = "en" | "fr" | "pt" | "de";

export type MultiLanguageString = { [language in LanguageCode]: string };

export const text: { [key: string]: MultiLanguageString } = {
    ACT:              { en: "act",                       fr: "acte",                             pt: "ato",                  de: "Akt" },
    ACTS:             { en: "acts",                      fr: "actes",                            pt: "atos",                 de: "Akte" },
    SCENE:            { en: "scene",                     fr: "scène",                            pt: "cena",                 de: "Szene" },
    SCENES:           { en: "scenes",                    fr: "scenes",                           pt: "cenas",                de: "Szenen" },
    SCENE_STRUCTURE:  { en: "measures",                  fr: "mesures",                          pt: "compassos",            de: "Takte" },
    BAR:              { en: "bar",                       fr: "mesure",                           pt: "compasso",             de: "Takt" },
    BARS:             { en: "bars",                      fr: "mesures",                          pt: "compassos",            de: "Takte" },
    BEAT:             { en: "beat",                      fr: "temps",                            pt: "tempo",                de: "Schlag" },
    PREV_BAR:         { en: "previous bar",              fr: "mesure précédente",                pt: "compasso anterior",    de: "vorheriger Takt" },
    NEXT_BAR:         { en: "next bar",                  fr: "mesure suivante",                  pt: "próximo compasso",     de: "nächster Takt" },
    PREV_PAGE:        { en: "previous page",             fr: "page précédente",                  pt: "página anterior",      de: "vorherige Seite" },
    NEXT_PAGE:        { en: "next page",                 fr: "page suivante",                    pt: "próxima página",       de: "nächste Seite" },
    TITLE:            { en: "<i>Wozzeck</i> Annotated Score",
                        fr: "Partition annotée de <i>Wozzeck</i>",
                        pt: "Partitura Anotada de <i>Wozzeck</i>",
                        de: "Kommentierte Partitur von <i>Wozzeck</i>" },
    BYLINE: {
        en: "<p>Inform Performance and Creation Through Analysis, a research project funded by the Social Sciences and Humanities Research Council of Canada (SSHRC), Connexion Grant (November 2025–October 2026)</p>\n" +
            "<h2>Scientific Direction:</h2>\n" +
            "\n" +
            "<ul>\n" +
            "  <li><em>François-Hugues Leclair</em>: Principal Investigator, composer, Associate Professor of Composition and Writing at the Faculty of Music, Université de Montréal (FMus-UdeM)</li>\n" +
            "  <li><em>Zoey Cochran</em>: co-researcher, musicologist, singer, artistic director of the Canada Research Chair in Opera Creation (CRCCO), visiting professor at FMus-UdeM</li>\n" +
            "</ul>\n" +
            "\n" +
            "<h2>Research team members</h2>\n" +
            "<ul>\n" +
            "  <li><em>Jean-Michaël Lavoie</em>: conductor, associate professor at FMus-UdeM</li>\n" +
            "  <li><em>Marie-Annick Béliveau</em>: mezzo-soprano, artistic director of Chants libres, lecturer at the Université de Québec à Montréal (UQAM)</li>\n" +
            "  <li><em>Ana Sokolovic</em>: composer, holder of the CRCCO, full professor at FMus-UdeM</li>\n" +
            "</ul>\n" +
            "\n" +
            "<h2>General Coordinator</h2>\n" +
            "<ul>\n" +
            "  <li><em>Ravi Shankar Viana Domingues</em>: PhD candidate in musicology at FMus-UdeM</li>\n" +
            "</ul>\n" +
            "\n" +
            "\n" +
            "<h2>Contributors</h2>\n" +
            "<ul>\n" +
            "  <li><em>Marcelo Wanderley</em>: Professor of Music Technology at the Faculty of Music, McGill University; Director of the Center for Interdisciplinary Research in Music Media and Technology (CIRMMT)</li>\n" +
            "  <li><em>Matthieu Galliker</em>: Supervision of the development of the interactive score; PhD candidate in musicology at FMus-UdeM</li>\n" +
            "</ul>\n" +
            "\n" +
            "<h2>Research Assistants</h2>\n" +
            "<ul>\n" +
            "  <li><em>Arden Butterfield</em>: website designer, Master's candidate in music technology at the Faculty of Music, McGill University</li>\n" +
            "  <li><em>Hugo Duguay</em> and <em>Olivier Tremblay</em>: collection of analytical data for the development of the interactive score, Master's candidates in Composition and Sound Design at FMus-UdeM</li>\n" +
            "</ul>",
        fr: "<p>Informer l'interprétation et la création par l'analyse, projet de recherche subventionné par le Conseil de recherches en sciences humaines du Canada (CRSH), Subvention Connexion (novembre 2025-octobre 2026)</p>\n" +
            "<h2>Direction scientifique :</h2>\n" +
            "\n" +
            "<ul>\n" +
            "  <li><em>François-Hugues Leclair</em> : chercheur principal, compositeur, professeur agrégé en composition et écriture à la Faculté de Musique de l'Université de Montréal (FMus-UdeM)</li>\n" +
            "  <li><em>Zoey Cochran</em> : cochercheuse, musicologue, chanteuse, directrice artistique de la Chaire de recherche du Canada en création d'opéra (CRCCO), professeure invitée à la FMus-UdeM</li>\n" +
            "</ul>\n" +
            "\n" +
            "<h2>Membres de l'équipe de recherche</h2>\n" +
            "<ul>\n" +
            "  <li><em>Jean-Michaël Lavoie</em> : chef d'orchestre, professeur agrégé à la FMus-UdeM</li>\n" +
            "  <li><em>Marie-Annick Béliveau</em> : mezzo-soprano, directrice artistique de Chants libres, chargée de cours à l'Université de Québec à Montréal (UQAM)</li>\n" +
            "  <li><em>Ana Sokolovic</em> : compositrice, titulaire de la CRCCO, professeure titulaire à la FMus-UdeM</li>\n" +
            "</ul>\n" +
            "\n" +
            "<h2>Coordonnateur général</h2>\n" +
            "<ul>\n" +
            "  <li><em>Ravi Shankar Viana Domingues</em> : candidat au Doctorat en musicologie à la FMus-UdeM</li>\n" +
            "</ul>\n" +
            "\n" +
            "\n" +
            "<h2>Collaborateurs</h2>\n" +
            "<ul>\n" +
            "  <li><em>Marcelo Wanderley</em> : professeur en technologies musicales à la Faculté de Musique de l'Université McGill, directeur du Center for Interdisciplinary Research in Music Media and Technology (CIRMMT)</li>\n" +
            "  <li><em>Matthieu Galliker</em> : supervision de l'élaboration de la partition interactive, candidat au Doctorat en musicologie à la FMus-UdeM</li>\n" +
            "</ul>\n" +
            "\n" +
            "<h2>Auxiliaires de recherche</h2>\n" +
            "<ul>\n" +
            "  <li><em>Arden Butterfield</em> : concepteur du site Web, candidat à la Maîtrise en technologies musicales à la Faculté de Musique de l'Université McGill</li>\n" +
            "  <li><em>Hugo Duguay</em> et <em>Olivier Tremblay</em> : recueillement des données analytiques pour l'élaboration de la partition interactive, candidats à la Maîtrise en composition et création sonore à la FMus-UdeM</li>\n" +
            "</ul>",
        pt: "<p>Informar a interpretação e a criação através da análise, projeto de investigação financiado pelo Conselho de Investigação em Ciências Humanas do Canadá (CRSH), Bolsa Connexion (novembro de 2025-outubro de 2026)</p>\n" +
            "<h2>Direção científica:</h2>\n" +
            "\n" +
            "<ul>\n" +
            "  <li><em>François-Hugues Leclair</em>: investigador principal, compositor, professor catedrático de composição e escrita na Faculdade de Música da Universidade de Montreal (FMus-UdeM)</li>\n" +
            "  <li><em>Zoey Cochran</em>: co-investigadora, musicóloga, cantora, diretora artística da Cátedra de Investigação do Canadá em Criação de Ópera (CRCCO), professora convidada na FMus-UdeM</li>\n" +
            "</ul>\n" +
            "\n" +
            "<h2>Membros da equipa de investigação</h2>\n" +
            "<ul>\n" +
            "  <li><em>Jean-Michaël Lavoie</em>: maestro, professor catedrático na FMus-UdeM</li>\n" +
            "  <li><em>Marie-Annick Béliveau</em>: mezzo-soprano, diretora artística da Chants libres, docente na Universidade de Quebec em Montreal (UQAM)</li>\n" +
            "  <li><em>Ana Sokolovic</em>: compositora, titular da CRCCO, professora titular na FMus-UdeM</li>\n" +
            "</ul>\n" +
            "\n" +
            "<h2>Coordenador geral</h2>\n" +
            "<ul>\n" +
            "  <li><em>Ravi Shankar Viana Domingues</em>: doutorando em musicologia na FMus-UdeM</li>\n" +
            "</ul>\n" +
            "\n" +
            "\n" +
            "<h2>Colaboradores</h2>\n" +
            "<ul>\n" +
            "  <li><em>Marcelo Wanderley</em>: professor de tecnologias musicais na Faculdade de Música da Universidade McGill, diretor do Center for Interdisciplinary Research in Music Media and Technology (CIRMMT)</li>\n" +
            "  <li><em>Matthieu Galliker</em>: supervisão da elaboração da partitura interativa, doutorando em musicologia na FMus-UdeM</li>\n" +
            "</ul>\n" +
            "\n" +
            "<h2>Assistentes de investigação</h2>\n" +
            "<ul>\n" +
            "  <li><em>Arden Butterfield</em>: criador do site, mestrando em tecnologias musicais na Faculdade de Música da Universidade McGill</li>\n" +
            "  <li><em>Hugo Duguay</em> e <em>Olivier Tremblay</em>: recolha de dados analíticos para a elaboração da partitura interativa, candidatos ao Mestrado em Composição e Criação Sonora na FMus-UdeM</li>\n" +
            "</ul>",
        de: "<p>Interpretation und Schöpfung durch Analyse – ein vom Social Sciences and Humanities Research Council of Canada (SSHRC) gefördertes Forschungsprojekt, Connexion-Förderung (November 2025–Oktober 2026)</p>\n" +
            "<h2>Wissenschaftliche Leitung:</h2>\n" +
            "\n" +
            "<ul>\n" +
            "  <li><em>François-Hugues Leclair</em>: Hauptforscher, Komponist, außerordentlicher Professor für Komposition und Musiktheorie an der Musikfakultät der Universität Montréal (FMus-UdeM)</li>\n" +
            "  <li><em>Zoey Cochran</em>: Mitforscherin, Musikwissenschaftlerin, Sängerin, künstlerische Leiterin des Canada Research Chair in Opera Creation (CRCCO), Gastprofessorin an der FMus-UdeM</li>\n" +
            "</ul>\n" +
            "\n" +
            "<h2>Mitglieder des Forschungsteams</h2>\n" +
            "<ul>\n" +
            "  <li><em>Jean-Michaël Lavoie</em>: Dirigent, außerordentlicher Professor an der FMus-UdeM</li>\n" +
            "  <li><em>Marie-Annick Béliveau</em>: Mezzosopranistin, künstlerische Leiterin von Chants libres, Dozentin an der Université de Québec à Montréal (UQAM)</li>\n" +
            "  <li><em>Ana Sokolovic</em>: Komponistin, Inhaberin des CRCCO, ordentliche Professorin an der FMus-UdeM</li>\n" +
            "</ul>\n" +
            "\n" +
            "<h2>Gesamtkoordinator</h2>\n" +
            "<ul>\n" +
            "  <li><em>Ravi Shankar Viana Domingues</em>: Doktorand der Musikwissenschaft an der FMus-UdeM</li>\n" +
            "</ul>\n" +
            "\n" +
            "\n" +
            "<h2>Mitarbeiter</h2>\n" +
            "<ul>\n" +
            "  <li><em>Marcelo Wanderley</em>: Professor für Musiktechnologie an der Musikfakultät der McGill University, Direktor des Center for Interdisciplinary Research in Music Media and Technology (CIRMMT)</li>\n" +
            "  <li><em>Matthieu Galliker</em>: Betreuung der Entwicklung der interaktiven Partitur, Doktorand der Musikwissenschaft an der FMus-UdeM</li>\n" +
            "</ul>\n" +
            "\n" +
            "<h2>Forschungsassistenten</h2>\n" +
            "<ul>\n" +
            "  <li><em>Arden Butterfield</em>: Webdesigner, Masterstudent im Fach Musiktechnologie an der Musikfakultät der McGill-Universität</li>\n" +
            "  <li><em>Hugo Duguay</em> und <em>Olivier Tremblay</em>: Erhebung der analytischen Daten für die Erstellung der interaktiven Partitur, Masterstudierende im Fach Komposition und Klangkunst an der FMus-UdeM</li>\n" +
            "</ul>",
    },
    SCHMIDT_DESCRIPTION:  { en: "Analysis by Professor René Schmidt, Music Analysis Class (fifth cycle), annotations by François-Hugues Leclair (September 1994–June 1995, Conservatoire National de Région de Strasbourg, France)",
                            fr: "Analyse du professeur René Schmidt, Classe d'Analyse musicale (cinquième cycle), annotations de François-Hugues Leclair (septembre 1994-juin 1995, Conservatoire National de Région de Strasbourg, France)",
                            pt: "Análise do professor René Schmidt, Classe de Análise Musical (quinto ciclo), anotações de François-Hugues Leclair (setembro de 1994–junho de 1995, Conservatoire National de Région de Strasbourg, França)",
                            de: "Analyse von Professor René Schmidt, Kurs für Musikanalyse (fünfter Zyklus), Annotationen von François-Hugues Leclair (September 1994–Juni 1995, Conservatoire National de Région de Strasbourg, Frankreich)" },
    GARANT_DESCRIPTION:   { en: "Analysis by Professor Serge Garant, Analysis of Twentieth-Century Works II class, annotations by Marcelle Deschênes, Faculty of Music of the Université de Montréal, 1968",
                            fr: "Analyse du professeur Serge Garant, Classe d'Analyse d'œuvres du vingtième siècle II, annotations de Marcelle Deschênes, Faculté de musique de l'Université de Montréal, 1968",
                            pt: "Análise do professor Serge Garant, Classe de Análise de Obras do Século XX II, anotações de Marcelle Deschênes, Faculdade de Música da Universidade de Montréal, 1968",
                            de: "Analyse von Professor Serge Garant, Kurs zur Analyse von Werken des 20. Jahrhunderts II, Annotationen von Marcelle Deschênes, Musikfakultät der Universität Montréal, 1968" },
    PERLE_DESCRIPTION:    { en: "Classification of Leitmotifs according to the analysis of George Perle in: The Operas of Alban Berg, Volume One / Wozzeck, University of California Press, Berkeley / Los Angeles / London, 1980",
                            fr: "Classification des Leitmotifs selon l'analyse de George Perle dans l'ouvrage : The Operas of Alban Berg, Volume One / Wozzeck, University of California Press, Berkeley / Los Angeles / London, 1980",
                            pt: "Classificação dos Leitmotifs segundo a análise de George Perle na obra: The Operas of Alban Berg, Volume One / Wozzeck, University of California Press, Berkeley / Los Angeles / London, 1980",
                            de: "Klassifizierung der Leitmotive nach der Analyse von George Perle in: The Operas of Alban Berg, Volume One / Wozzeck, University of California Press, Berkeley / Los Angeles / London, 1980" },
    USER_DESCRIPTION: {
                            en: "Annotations created by the user, using the buttons next to the search bar.",
                            fr: "Annotations créées par l'utilisateur, à l'aide des boutons situés à côté de la barre de recherche.",
                            pt: "Anotações criadas pelo usuário, utilizando os botões ao lado da barra de pesquisa.",
                            de: "Vom Benutzer erstellte Annotationen mithilfe der Schaltflächen neben der Suchleiste."
    },
    ANNOTATIONS:        { en: "Annotations",              fr: "Annotations",                      pt: "Anotações",            de: "Annotationen" },
    TIMELINES:          { en: "Temporal Structure",        fr: "Structure temporelle",             pt: "Estrutura Temporal",   de: "Zeitliche Struktur" },
    VIDEO_PLAYER:       { en: "Video Player",              fr: "Lecteur vidéo",                    pt: "Reprodutor de Vídeo",  de: "Videoplayer" },
    TRANSPORT:          { en: "Navigation",                fr: "Navigation",                       pt: "Navegação",            de: "Navigation" },
    ARCHITECTURE:       { en: "Architecture",              fr: "Architecture",                     pt: "Arquitetura",          de: "Architektur" },
    SCORE_VIEWER:       { en: "Score",                     fr: "Partition",                        pt: "Partitura",            de: "Partitur" },
    LIBRETTO:           { en: "Libretto",                  fr: "Livret",                           pt: "Libreto",              de: "Libretto" },
    PANELS:             { en: "Panels",                    fr: "Panneaux",                         pt: "Painéis",              de: "Bedienfelder" },
    PAGE:               { en: "page",                      fr: "page",                             pt: "página",               de: "Seite" },
    INFO:               { en: "credits",                   fr: "crédits",                          pt: "créditos",             de: "Credits" },
    CLOSE:              { en: "close",                     fr: "annuler",                          pt: "fechar",               de: "schließen" },
    THEME_LIGHT:        { en: "light mode",                fr: "mode clair",                       pt: "modo claro",           de: "heller Modus" },
    THEME_DARK:         { en: "dark mode",                 fr: "mode sombre",                      pt: "modo escuro",          de: "dunkler Modus" },
    SEARCH_PLACEHOLDER: { en: "Search annotations…",       fr: "Rechercher des annotations…",      pt: "Pesquisar anotações…", de: "Annotationen durchsuchen…" },
    DYNAMICS:           { en: "Dynamics",                  fr: "Dynamiques",                       pt: "Dinâmica",             de: "Dynamik" },
    DURATION:           { en: "Duration",                  fr: "Durée",                            pt: "Duração",              de: "Dauer" },
    FORM:               { en: "Form",                      fr: "Formes",                           pt: "Forma",                de: "Form" },
    INTONATION:         { en: "Intonation",                fr: "Intonation",                       pt: "Entonação",            de: "Intonation" },
    MOTIFS:             { en: "Motifs",                    fr: "Motifs",                           pt: "Motivos",              de: "Motive" },
    TIMBRE:             { en: "Timbre",                    fr: "Timbre",                           pt: "Timbre",               de: "Klangfarbe" },
    GRAPHICAL:          { en: "Graphical",                 fr: "Graphique",                        pt: "Gráfico",              de: "Grafisch" },
    USER:               { en: "User",                      fr: "Utilisateur·trice",                pt: "Usuário",              de: "Benutzer" },
    NEXT:               { en: "Next",                      fr: "Suivant",                          pt: "Próximo",              de: "Weiter" },
    DONE:               { en: "Done",                      fr: "Terminer",                         pt: "Concluir",             de: "Fertig" },
};

export const capitalizeFirstLetter = <T extends string>(s: T) =>
    (s[0].toUpperCase() + s.slice(1)) as Capitalize<typeof s>;
