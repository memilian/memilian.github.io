
function init(){
  this.counter = 0;
  this.split = false;
  this.duration = 15;
  this.elapsed = 0;
  this.mass = 8;
}

function update(){
  this.distanceLeft -= ddist * this.mass;
  if(this.distanceLeft <= 0){
    if(!this.split){
      this.waveRadius = this.deltaWave * Math.cos(this.counter * this.varianceSpeed);
      this.deltaWave = 100 + 75 * Math.cos(this.counter * .15 * (0.5 + Math.random() * 0.001));
      this.distanceLeft += 50;
      this.counter++;
      this.res.push({
        type: Math.random() < 0.1 ? Gold : Silver,
        x: this.bx + this.waveRadius
      });
      if(Math.random() < 0.06) this.res.push({
        type: Ast,
        x: this.bx
      });
      if(this.elapsed > 2 && Math.abs(this.waveRadius) < 25){
        this.split = true;
        this.splitX = this.bx + this.waveRadius;
        counter = 0;
      }
    }else{
      if(this.waveRadius < 200){
        this.res.push({
          type: Math.random() < 0.1 ? Gold : Silver,
          x: this.splitX + this.waveRadius
        });
        this.res.push({
          type: Math.random() < 0.1 ? Gold : Silver,
          x: this.splitX - this.waveRadius
        });
        this.waveRadius = 8 * counter++;
        this.distanceLeft += 50;
      }else{
        if(Math.random() < 0.5) this.waveRadius *= -1;
        var nstar = 16;
        var twoPi = 6.2830;
        var dangle = twoPi / nstar;
        var radius = 50;
        for(i in 0...nstar){
          this.res.push({
            type: Math.random() < 0.1 ? Gold : Silver,
            x: this.splitX + this.waveRadius + Math.cos(dangle * i) * radius,
            y: -130 + Math.sin(dangle * i) * radius
          });
        }
        this.res.push({
          type: Gold,
          x: this.splitX + this.waveRadius,
          y: -130
        });
        this.res.push({
          type: Mine,
          x: this.splitX - this.waveRadius,
          y: -130
        });
        this.distanceLeft += 50 + radius;
        this.finished = true;
      }
    }

  }
}

