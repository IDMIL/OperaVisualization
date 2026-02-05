class ScoreManager extends TimeManagerListener {
  constructor() {
    super();
    this.currentPage = 5;
  }

  timeUpdated(scoreTime) {
    let newPage = bar_to_page[scoreTime.bar - 1].page;
    if (newPage !== this.currentPage) {
      this.currentPage = newPage;

      document.getElementById('score-viewer-image').src = "data/pages/sheet" + this.currentPage + ".png";
    }
  }
}