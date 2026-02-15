class ScoreManager extends TimeManagerListener {
  constructor() {
    super();
    this.currentPage = undefined;
  }

  timeUpdated(scoreTime) {
    let newPage = bar_to_page[scoreTime.act-1][scoreTime.bar].page;
    let im = document.getElementById('score-viewer-image');

    if (newPage !== this.currentPage) {
      this.currentPage = newPage;
      im.src = bar_to_page[scoreTime.act-1][scoreTime.bar].image;
    }
    let w = im.width;
    let h = im.height;

    let overlay = document.getElementById('current-bar-overlay');
    overlay.style.top = bar_to_page[scoreTime.act-1][scoreTime.bar].y * h + "px";
    overlay.style.left = bar_to_page[scoreTime.act-1][scoreTime.bar].x * w + "px";
    overlay.style.width = bar_to_page[scoreTime.act-1][scoreTime.bar].width * w + "px";
    overlay.style.height = bar_to_page[scoreTime.act-1][scoreTime.bar].height * w + "px";

  }
}