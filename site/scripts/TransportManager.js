function getSceneNumber(scoreTime) {
  const act = scoreTime.act;
  const bar = scoreTime.bar;
  const sceneRanges = scene_bar_ranges[act];
  let sceneNumber = 1;
  for (const range of sceneRanges) {
    if (bar >= range[0] && bar <= range[1]) {
      return sceneNumber;
    }
    sceneNumber++;
  }
}


class TransportManager extends TimeManagerListener {
  constructor(tm) {
    super();
    this.timeManager = tm;

    document.getElementById("prev-bar-button").onclick = () => {
      console.log("prev bar button clicked");
      this.timeManager.advanceBar(-1);
    }
    document.getElementById("next-bar-button").onclick = () => {
      console.log("next bar button clicked");
      this.timeManager.advanceBar(1);
    }
  }

  timeUpdated(scoreTime) {
    document.getElementById("transport-act-number").innerText = scoreTime.act;
    document.getElementById("transport-scene-number").innerText = getSceneNumber(scoreTime);
    document.getElementById("transport-bar-number").innerText = scoreTime.bar;
    document.getElementById("transport-beat-number").innerText = scoreTime.beat;
  }

  timeManager;
}