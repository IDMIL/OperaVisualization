class TimeManagerListener {
  timeUpdated(scoreTime) {

  }
}

class TimeManager {
  constructor() {

  }

  advanceBar(numBars) {
    this.scoreTime.bar += numBars;
    this.notifyListeners();
  }

  notifyListeners() {
    for (const listener of this.listeners) {
      console.log("notifyListeners()", listener);
      listener.timeUpdated(this.scoreTime);
    }
  }

  scoreTime = {
    act: 1,
    scene: 1,
    bar: 1,
    beat: 1,
    barLength: 4
  }

  listeners = [];
}