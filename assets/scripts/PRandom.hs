
function init(){
  this.mass = 8;
}

function update(){
  this.distanceLeft -= ddist * this.mass;
  if(this.distanceLeft <= 0){
    this.distanceLeft += Math.random() * 140;
    this.res.push({
      type: Math.random() < 0.1 ? Gold : Silver,
      x: this.bx + Math.random() * 600 - 300
    });
    if(Math.random() < 0.06) this.res.push({
      type: Math.random() < 0.5 ? Mine : Ast,
      x: this.bx + Math.random() * 600 - 300
    });
  }
}
