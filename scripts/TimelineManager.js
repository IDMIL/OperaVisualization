class TimelineManager extends TimeManagerListener {
  constructor(tm) {
    super();
    this.timeManager = tm;

    let actLengths = [];
    let totalLength = 0;
    for (const actBarRanges of scene_bar_ranges) {
      const l = actBarRanges[actBarRanges.length - 1][1] - actBarRanges[0][0];
      totalLength += l;
      actLengths.push(l);
    }

    let actsTimeline = document.getElementById("acts-timeline");
    for (let i = 0; i < actLengths.length; i++) {
      let actDiv = document.createElement("div");
      actDiv.classList.add("timeline-button");
      actDiv.classList.add("timeline-act");
      actDiv.innerText = (i + 1).toString();
      actDiv.style.width = (actLengths[i] * 100 / totalLength) + "%";
      actDiv.onclick = () => {
        console.log("timeline button clicked, act " + (i + 1));
        this.timeManager.goToTime(i + 1, 1, 1);
      }
      actsTimeline.appendChild(actDiv);
    }

    let scenesTimeline = document.getElementById("scenes-timeline");
    let actNumber = 1;
    for (const actBarRange of scene_bar_ranges) {
      let sceneNumber = 1;
      for (const sceneBarRange of actBarRange) {
        let sceneDiv = document.createElement("div");
        sceneDiv.classList.add("timeline-button");
        sceneDiv.classList.add("timeline-scene");
        sceneDiv.style.width = ((sceneBarRange[1] - sceneBarRange[0]) * 100 / totalLength) + "%";
        sceneDiv.innerText = sceneNumber;
        const a = actNumber;
        const sceneBar = sceneBarRange[0];
        sceneDiv.onclick = () => {
          console.log("timeline button clicked, act " + actNumber + " scene " + sceneNumber);
          this.timeManager.goToTime(a, sceneBar, 1, 1);
        }
        scenesTimeline.appendChild(sceneDiv);
        sceneNumber++;
      }
      actNumber++;
    }

    let sceneStructureTimeline = document.getElementById("scene-structure-timeline");
    let sceneStructureDiv = document.createElement("div");
    sceneStructureDiv.classList.add("timeline-button");
    sceneStructureDiv.id = "scene-structure-button";
    sceneStructureDiv.style.width = "100%";
    sceneStructureTimeline.appendChild(sceneStructureDiv);

    let cursorDiv = document.createElement("div");
    cursorDiv.id = "timeline-cursor";
    sceneStructureDiv.appendChild(cursorDiv);
    let cursorLabel = document.createElement("div");
    cursorLabel.id = "timeline-cursor-label";
    cursorLabel.innerText = "Cursor";
    cursorDiv.appendChild(cursorLabel);

    sceneStructureDiv.addEventListener("mouseenter", (event) => {
      let timelineCursor = document.getElementById("timeline-cursor");
      timelineCursor.style.display = "block";

    });

    sceneStructureDiv.addEventListener("mouseleave", (event) => {
      let timelineCursor = document.getElementById("timeline-cursor");
      timelineCursor.style.display = "none";

    });


    sceneStructureDiv.addEventListener("mousemove", (event) => {
      let timelineCursor = document.getElementById("timeline-cursor");
      const rect = event.target.getBoundingClientRect();
      timelineCursor.style.left = event.clientX - rect.x + "px";

      const proportion = (event.clientX - rect.x) / (rect.width);
      cursorLabel.innerText = "bar " + this.#getBarAtProportionOfCurrentScene(proportion);
    });

      sceneStructureDiv.addEventListener("click", (event) => {
      const rect = event.target.getBoundingClientRect();
      const clickProportion = (event.clientX - rect.x) / (rect.width);

      this.timeManager.goToTime(
        this.timeManager.getCurrentAct(),
        this.#getBarAtProportionOfCurrentScene(clickProportion),
        1);
    });
  }

  #getBarAtProportionOfCurrentScene(proportion) {
    const sceneRange = scene_bar_ranges[this.timeManager.getCurrentAct()-1][this.timeManager.getCurrentScene()-1];
    return Math.floor(sceneRange[0] + proportion * (sceneRange[1] - sceneRange[0]));
  }
}