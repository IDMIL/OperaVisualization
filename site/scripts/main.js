window.onload = function() {
  console.log("loaded");
  let timeManager = new TimeManager();

  let scoreManager = new ScoreManager();
  let transportManager = new TransportManager(timeManager);
  let timelineManager = new TimelineManager(timeManager);

  timeManager.listeners.push(scoreManager);
  timeManager.listeners.push(transportManager);
  timeManager.listeners.push(timelineManager);
}
