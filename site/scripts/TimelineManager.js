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
        sceneDiv.onclick = () => {
          console.log("timeline button clicked, act " + actNumber + " scene " + sceneNumber);
          this.timeManager.goToTime(actNumber, sceneNumber, 1, 1);
        }
        scenesTimeline.appendChild(sceneDiv);
        sceneNumber++;
      }
      actNumber++;
    }
  }
}