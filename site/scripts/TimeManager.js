class TimeManagerListener {
  timeUpdated(scoreTime) {

  }
}

class TimeManager {
  constructor() {

  }

  goToTime(act, bar, beat) {
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

  scoreTime = {
    act: 1,
    bar: 1,
    beat: 1,
    barLength: 4
  }

  listeners = [];
}