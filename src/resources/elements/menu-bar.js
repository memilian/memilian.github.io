import {inject, customElement, bindable} from 'aurelia-framework';
import { LerpService } from '../../services/lerp-service';

@inject(LerpService)
@customElement('menu-bar')
export class MenuBar{
  @bindable titles;
  mouseY = 0;
  wasMouseInRange = false;
  constructor(ls){
    this.lerpService = ls;
  }

  attached(){
    window.addEventListener('mousemove', function(event){
      this.mouseY = event.clientY;
      
      if(this.mouseY < 35){
        this.wasMouseInRange = true;
        this.menu.style.height = "21px";
      }else if(this.wasMouseInRange){
        this.wasMouseInRange = false;
        this.menu.style.height = 0;
      }
    }.bind(this));
    window.addEventListener('scroll', this.updateProgress.bind(this));
    this.updateProgress();
    this.current.style.width = (100 / this.titles.length) + "%";
  }

  updateProgress(){
    let y = (window.pageYOffset || document.scrollTop)  - (document.clientTop || 0) || 0;
    let h = document.body.scrollHeight;
    this.foreground.style.width = (y * 100 / h) + "%";
  }

  goToScreen(index){
    let y = (window.pageYOffset || document.scrollTop)  - (document.clientTop || 0) || 0;
    this.lerpService.addEasing(function(t){
      window.scrollTo(0, this.lerpService.lerp(y, window.innerHeight * (index - 1), 1 - (1-t) * (1-t) * (1-t)));
    }, 1000, this);
  }
}
