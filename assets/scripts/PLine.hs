
function init(){
  this.waveRadius = 150.;
  this.deltaWave = 100.0;
  this.varianceSpeed = 0.28;
  this.counter = 0;
  this.mass = 8;
}

function update(){
  this.distanceLeft -= ddist * this.mass;
  if(this.distanceLeft <= 0){
    this.waveRadius = this.deltaWave * Math.cos(this.counter * this.varianceSpeed);
    this.deltaWave = 100 + 75 * Math.cos(this.counter * .15 * (0.5 + Math.random() * 0.001));
    this.distanceLeft += 130;
    this.counter++;

    this.res.push({
      type: Math.random() < 0.1 ? Gold : Silver,
      x: this.bx + this.waveRadius
    });
    if(Math.random() < 0.06){
      if(this.waveRadius > 150)
        this.res.push({
          type: Mine,
          x: this.bx
        });
      else
        this.res.push({
          type: Mine,
          x: this.bx
        });
    }
  }
}
