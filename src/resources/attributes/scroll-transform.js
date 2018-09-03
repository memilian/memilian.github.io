
import {inject, customAttribute, DOM} from 'aurelia-framework';
import { LerpService } from '../../services/lerp-service';

@customAttribute('scroll-transform')
@inject(DOM.Element, LerpService)
export class ScrollTransform {

  index = 0;

  constructor(element, lerp) {
    this.lerpService = lerp;
    this.element = element;
    window.addEventListener('scroll', function(event){
      let y = (window.pageYOffset || document.scrollTop)  - (document.clientTop || 0) || 0;
      let ratio = (1 + y / (window.innerHeight)) - this.index;
      let rotateAmount = 180;
      let from = 0;
      let to = 90;
      if(ratio >= 0 && ratio < 1){
        element.style.transformOrigin = "center bottom 0px";
        from = 0;
        to = 90;
      }else if(ratio > -1 && ratio < 0){
        element.style.transformOrigin = "center top 0px";
        from = -90;
        to = 0;
        ratio = 1 - ratio *- 1;
      }
      if(ratio > 1) ratio = 1;
      if(ratio < 0) ratio = 0;
      
      rotateAmount = this.lerpService.lerp(from, to, ratio);
      this.element.style.transform = "perspective(675px)rotateX("+rotateAmount+"deg)";
    }.bind(this));
  }

  valueChanged(newValue, oldValue) {
    this.index = parseInt(newValue);
  }

}
