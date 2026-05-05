import {text} from "./data/text";
import {globals} from "./globals";

function showCredits(showOrHide: boolean) {
    const credits = document.getElementById('credits-anchor');
    if (credits) {
        credits.style.display = showOrHide ? 'block' : 'none';
    }

    const darken = document.getElementById('darken');
    if (darken) {
        darken.style.display = showOrHide ? 'block' : 'none';
    }
}

function getTheme(): 'dark' | 'light' {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function setTheme(theme: 'dark' | 'light') {
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
}

function themeToggleLabel(): string {
    const t = text[globals.language];
    return getTheme() === 'dark' ? t.THEME_LIGHT : t.THEME_DARK;
}

export class TitleSectionManager {
    constructor() {
        const titleSection = document.getElementById("title-section");
        if (titleSection) {
            const otherLangPage = globals.language === 'en' ? 'fr.html' : 'en.html';
            const otherLangName = globals.language === 'en' ? 'FR' : 'EN';

            titleSection.innerHTML = `<h1>` + text[globals.language].TITLE + `</h1>
      <div class="title-links-and-buttons"><h3 id="info-link">Info</h3><h3 id="theme-toggle">${themeToggleLabel()}</h3><h3 class="language-switch"><a href="`+ otherLangPage + `">` + otherLangName + `</a></h3></div>`;

            const darken = document.createElement("div");
            darken.id = 'darken';
            titleSection.appendChild(darken);

            const creditsAnchor = document.createElement("div");
            creditsAnchor.setAttribute("id", "credits-anchor");
            creditsAnchor.innerHTML = `<div id="credits-box"><div id="credits-box-contents">
<div id="credits-box-text"><p>` + text[globals.language].BYLINE + `</p></div>
<div id="credits-box-buttons"><button id="close-credits-box">` + text[globals.language].CLOSE + `</button></div>
</div></div>`;
            titleSection.append(creditsAnchor);
            showCredits(false);
            document.getElementById("close-credits-box")?.addEventListener("click", () => showCredits(false), false);
            document.getElementById("info-link")?.addEventListener("click", () => showCredits(true), false);

            document.getElementById("theme-toggle")?.addEventListener("click", () => {
                const next = getTheme() === 'dark' ? 'light' : 'dark';
                setTheme(next);
                const toggle = document.getElementById("theme-toggle");
                if (toggle) toggle.textContent = themeToggleLabel();
            });
        }
    }
}