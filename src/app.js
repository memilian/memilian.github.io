import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class App {
  screens=[];
  screenRefs=[];

  eventAggregator;

  constructor(ea){
    this.eventAggregator = ea;
    this.screenVms = [
      "screens/screen-desc",
      "screens/screen-projects",
      "screens/screen-skills",
      "screens/screen-cv",
      "screens/screen-contact",
    ]
  }

  attached(){

    window.addEventListener('resize', this.resizeScreens.bind(this));

    let watchReady = null;
    watchReady = setInterval(function(){
      if(pbProgress >= 1.0){
        setTimeout(function(){
          let loader = document.querySelector('.loader');
          if(loader != null){
            loader.style.transition = "all 1s ease-in-out";
            loader.style.backgroundColor = "rgba(66,67,66,0)";
          }
          let segments = document.querySelectorAll('.circle-segment');
          for(let s of segments){
            s.style.transition = "all 1s ease-in-out";
            s.style.opacity = 0;
          }
          
          setTimeout(function(){
            stopLoader();
            this.resizeScreens();
            this.eventAggregator.publish("app-ready");
          }.bind(this), 1000);
        }.bind(this), 2000);

        setTimeout(function(){
          this.resizeScreens();
        }.bind(this), 1000);

        clearInterval(watchReady);
      }
    }.bind(this), 25);

    // setTimeout(this.resizeScreens.bind(this), 100);
    
  }

  resizeId = null;

  resizeScreens(){
    clearTimeout(this.resizeId);
    this.resizeId = setTimeout(function(){
      this.eventAggregator.publish("resize", {w: window.innerWidth, h: window.innerHeight});
      this.screens = document.querySelectorAll('.screen');
      var h = window.innerHeight;
      for(let sc of this.screens){
        sc.style.height = h+'px';
      }
    }.bind(this), 40)
  }
}
