import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { LerpService } from '../../services/lerp-service';

@inject(EventAggregator, LerpService)
export class ProjectShowcase{

  constructor(ea, ls){
    this.lerpService = ls;
    this.ea = ea;
    this.ea.subscribe('update-project-transform', this.updateTransform.bind(this));
  }

  activate(data){
    this.data = data;
  }

  

  attached(){
    this.updateTransform({ direction: 'prev',
      prevActive : this.data.parent.prevActiveIndex,
      active: this.data.parent.activeIndex,
      previous: this.data.parent.previousIndex,
      next: this.data.parent.nextIndex
    });
  }

  
}
