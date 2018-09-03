
import {inject, customAttribute, DOM} from 'aurelia-framework';
import { LerpService } from '../../services/lerp-service';

@customAttribute('scroll-next')
@inject(DOM.Element, LerpService)
export class ScrollNext {

  constructor(element, lerp) {
    this.lerpService = lerp;
    this.element = element;
  }

  attached(){

    let nextBtn = document.createElement('div');
    nextBtn.classList.add('btn');
    nextBtn.classList.add('btn-hidden');
    nextBtn.classList.add('btn-next');
    this.nextBtn = nextBtn;
    this.element.appendChild(nextBtn);

    setTimeout(function(){
      this.nextBtn.classList.remove('btn-hidden');
    }.bind(this), 2000);

    this.nextBtn.onclick = this.toNext.bind(this);
  }

  toNext(){
    let y = (window.pageYOffset || document.scrollTop)  - (document.clientTop || 0) || 0;
    this.lerpService.addEasing(function(t){
      window.scrollTo(0, this.lerpService.lerp(y, window.innerHeight * this.index, 1 - (1-t) * (1-t) * (1-t)));
    }, 1000, this);
  }

  valueChanged(newValue, oldValue) {
    this.index = parseInt(newValue);
  }

}
