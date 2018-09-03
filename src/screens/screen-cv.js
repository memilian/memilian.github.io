

export class ScreenCv{
  index;
  displayTitle="CV";
  activate(data){
    this.index = data.index;
    window.advanceProgress();
  }
}
