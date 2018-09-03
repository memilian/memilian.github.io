import {inject, customAttribute, DOM} from 'aurelia-framework';
import { LerpService } from '../../services/lerp-service';

@customAttribute('scroll-target')
@inject(DOM.Element, LerpService)
export class ScrollTarget {

  index = 0;

  constructor(element, lerp) {
    this.lerpService = lerp;
    this.element = element;
    this.smoothScrollId = null;
    let cancelNext = false;
    let lastY = 0;
    window.addEventListener('scroll', function(event){
      let y = (window.pageYOffset || document.scrollTop)  - (document.clientTop || 0) || 0;
      let dir = y - lastY;
      if(cancelNext){
        clearTimeout(this.smoothScrollId);
        event.preventDefault = true;
        return;
      }
      lastY = y;
      clearTimeout(this.smoothScrollId);
      this.smoothScrollId = setTimeout(function(){
        let ratio = 1 + y / (window.innerHeight);
        if(Math.abs(dir) < 15 && dir > 0 && ratio > this.index && ratio < this.index + 1
          || Math.abs(dir) < 15 && dir < 0 && ratio > this.index && ratio < this.index+1){
            let indexTweak = dir < 0 ? -1 : 0;
            cancelNext = true;
            this.lerpService.addEasing(function(t){
              window.scrollTo(0, this.lerpService.lerp(y, window.innerHeight * (this.index + indexTweak), 1-(1-t)*(1-t)*(1-t)));
              cancelNext = true;
            }, 1000, this, null, function(){
              clearTimeout(this.smoothScrollId);
              this.smoothScrollId = null;
              cancelNext = true;
              setTimeout(()=>cancelNext = false, 20);
            });
        }
      }.bind(this), 50);
    }.bind(this));
  }

  valueChanged(newValue, oldValue) {
    this.index = parseInt(newValue);
  }

}
