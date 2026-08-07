import {LanguageCode, text} from "./data/text";
import {globals} from "./globals";

type Side = "left" | "right" | "top" | "bottom";

interface TutorialStep {
    targetId : string,
    side: Side
    description : {[language in LanguageCode] : string},
}

export class Tutorial {
    private tutorialSteps: TutorialStep[] = [
        {targetId: "timelines-section", side: "bottom", description: {
                'en': "Use the act, scene, and scene-structure timelines to navigate throughout the score.",
                'fr': "Utilisez les chronologies par acte, par scène et par structure de scène pour parcourir la partition.",
                'de': "Verwenden Sie die Zeitleisten für Akte, Szene und Szenenstruktur, um sich in der Partitur zurechtzufinden.",
                'pt': "Para navegar pela partitura, utilize a cronologia por ato, por cena e por compasso. "}},
        {targetId: "annotations-section", side: "right", description: {
                'en': "Read and search for annotations.",
                    'fr': "Lisez et recherchez des annotations.",
                'de': "Lesen und suchen Sie nach Annotationen.",
                'pt': "Aqui você poderá ler, pesquisar e acrescentar suas próprias anotações."
            }}
    ]

    private tutorialStepIndex = 0;

    constructor() {
        const tut = document.createElement('div');
        tut.id = "tutorial-window";
        const tutText = document.createElement('div');
        tutText.id = "tut-text";
        tut.appendChild(tutText);
        const nextTutButton = document.createElement('button');
        nextTutButton.id = "next-tut-button";
        nextTutButton.textContent = text.NEXT[globals.language];
        nextTutButton.onclick = () => this.advanceTutorialStep();
        tut.appendChild(nextTutButton);
        document.body.appendChild(tut);

        this.advanceTutorialStep();
    }

    advanceTutorialStep() {
        let tut = document.getElementById('tutorial-window');
        if (tut == null) {
            return;
        }
        let tutText = document.getElementById("tut-text");
        if (tutText) {
            const desc = this.tutorialSteps[this.tutorialStepIndex].description[globals.language];
            console.log("setting tutorial text", desc);
            tutText.textContent = desc
        }
        if (this.tutorialStepIndex < this.tutorialSteps.length) {
            const step = this.tutorialSteps[this.tutorialStepIndex];
            tut.dataset.side = step.side;
            const parent = document.getElementById(step.targetId);
            if (parent != null) {
                parent.appendChild(tut);
            }
        }
        this.tutorialStepIndex++;
        if (this.tutorialStepIndex >= this.tutorialSteps.length) {
            const nextButton = document.getElementById("next-tut-button");
            if (nextButton != null) {
                nextButton.textContent = text.DONE[globals.language];
                nextButton.onclick = () => {
                    let tut = document.getElementById('tutorial-window');
                    if (tut != null) {
                        tut.remove();
                    }
                };
            }
        }
    }

}