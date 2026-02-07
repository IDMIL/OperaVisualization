class AnnotationManager extends TimeManagerListener {
  constructor(timeManager) {
    super();

    this.timeManager = timeManager;

    let annotationsSection = document.getElementById('annotations-section');

    for (const annotation of annotations) {
      console.log(annotation);
      let annotationDiv = document.createElement("div");
      annotationDiv.classList.add("annotation");

      let timeStampDiv = document.createElement("div");
      timeStampDiv.classList.add("annotation-time-stamp");
      timeStampDiv.innerText = this.getStringForTimestamp(annotation.time);
      annotationDiv.appendChild(timeStampDiv);

      let annotationTextDiv = document.createElement("div");
      annotationTextDiv.classList.add("annotation-text");
      annotationTextDiv.innerText = annotation.text;
      annotationDiv.appendChild(annotationTextDiv);

      annotationDiv.onclick = () => {
        timeManager.goToTime(annotation.time.act, annotation.time.bar, annotation.time.beat);
      }

      annotationsSection.appendChild(annotationDiv);
    }
  }

  getStringForTimestamp(timestamp) {
    return 'Act ' + timestamp.act + ', scene ' + timestamp.scene + ', bar ' + timestamp.bar;
  }
}