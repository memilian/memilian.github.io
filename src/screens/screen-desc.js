import {inject} from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class ScreenDesc {
  
  displayTitle="A propos"
  isChrome = false;
  index;

  constructor(ea){
    this.ea = ea;
    this.isChrome = !!window.chrome && !! window.chrome.webstore;
    ea.subscribe("typing-finished", function(){
      this.portraitCrop.style.opacity = 1;
      this.portrait.style.filter = "blur(0px)";
      this.showKeys.style.opacity = 1;
      // if(!this.isChrome){
      //   this.chromeWarning.style.opacity = 1;
      // }
    }.bind(this));
  }

  activate(data){
    this.index = data.index;
    window.advanceProgress();
  }
}
