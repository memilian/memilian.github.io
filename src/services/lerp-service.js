let instance = null;

export class LerpService{

  idCounter = 0;

  constructor(){
    if(instance == null){
      instance = this;
      this.processEasings();
    }
    return instance;
  }

  addEasing(func, duration, scope, delay = 0, onFinish = null){
    let infos = {
      func: func.bind(scope),
      started: 0,
      duration: duration,
      onFinish: onFinish,
      canceled: false
    }
    setTimeout(function(){
      infos.started = Date.now();
      this.easingInfos.push(infos);
    }.bind(this), delay);
    return function(){
      let index = this.easingInfos.indexOf(infos);
      infos.canceled = true;
      if(index > -1)
        this.toRemove.push(infos);
    }.bind(this);
  }

  easingInfos = [];
  toRemove = [];
  processEasings(){
    let now = Date.now();
    for(let ease of this.easingInfos){
      let t = (now - ease.started) / ease.duration;
      if(t < 1){
        if(!ease.canceled)
          ease.func(t);
      }else{
        if(!ease.canceled)
          ease.func(1); //ensure that the ease function is last called with 1
        this.toRemove.push(ease);
        if(ease.onFinish != null) ease.onFinish();
      }
    }
    for(let rem of this.toRemove){
      this.easingInfos.splice(this.easingInfos.indexOf(rem), 1);
    }
    this.toRemove = [];
    requestAnimationFrame(this.processEasings.bind(this));
  }

  lerp(a, b, position) { return ((1.0 - position) * a) + (position * b); }
}
