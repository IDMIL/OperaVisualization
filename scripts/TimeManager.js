class TimeManagerListener {
  timeUpdated(scoreTime) {

  }
}

class TimeManager {
  constructor() {

  }

  goToTime(act, bar, beat) {
    console.log(`goToTime(${act}, ${bar}, ${beat})`);
    this.scoreTime.act = act;
    this.scoreTime.bar = bar;
    this.scoreTime.beat = beat;

    this.notifyListeners();
  }

  advanceBar(numBars) {
    this.scoreTime.bar += numBars;
    this.notifyListeners();
  }

  notifyListeners() {
    console.log("notifying listeners of scoreTime", this.scoreTime);
    for (const listener of this.listeners) {
      listener.timeUpdated(this.scoreTime);
    }
  }

  getCurrentAct() {
    return this.scoreTime.act;
  }

  getCurrentBarWithinAct() {
    return this.scoreTime.bar;
  }

  getCurrentScene() {
    const sceneRanges = scene_bar_ranges[this.getCurrentAct() - 1];
    for (let i = 0; i < sceneRanges.length; i++) {
      if (sceneRanges[i][0] <= this.getCurrentBarWithinAct() && this.getCurrentBarWithinAct() <= sceneRanges[i][1]) {
        return i + 1;
      }
    }
  }

  getProportionOfCurrentScene() {
      const sceneRanges = scene_bar_ranges[this.getCurrentAct() - 1];
    for (let i = 0; i < sceneRanges.length; ++i) {
      if (sceneRanges[i][0] <= this.getCurrentBarWithinAct() && this.getCurrentBarWithinAct() <= sceneRanges[i][1]) {
          return (this.getCurrentBarWithinAct() - sceneRanges[i][0]) / (sceneRanges[i][1] + 1 - sceneRanges[i][0]);
      }
    }
  }

  scoreTime = {
    act: 1,
    bar: 1,
    beat: 1,
    barLength: 4
  }

  listeners = [];
}