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
    document.getElementById("transport-scene-number").innerText = scoreTime.scene;
    document.getElementById("transport-bar-number").innerText = scoreTime.bar;
    document.getElementById("transport-beat-number").innerText = scoreTime.beat;
  }

  timeManager;
}