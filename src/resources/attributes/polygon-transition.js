
import {inject, customAttribute, bindable, DOM} from 'aurelia-framework';
import { LerpService } from '../../services/lerp-service';

@customAttribute('polygon-transition')
@inject(DOM.Element, LerpService)
export class PolygonTransition {
  @bindable direction=1;
  @bindable orientation='vertical';

  rotX = 0;
  rotY = 0;
  rotZ = 0;

  constructor(element, lerp) {
    this.lerpService = lerp;
    this.element = element;
    this.element.position = "relative";
    window.addEventListener('resize', this.onresize.bind(this));
  }
  
  attached(){
    
    this.faces = [];
    let faceCount = this.element.children.length;
    this.faceCount = faceCount;

    let wrapper = document.createElement('div');
    this.element.appendChild(wrapper);
    for(let i = 0; i<this.faceCount; i++){
      let c = this.element.children[0]
      this.faces.push(c);
      wrapper.appendChild(c);
    }
    this.element.style.perspective = "500px";
    var w = this.element.clientWidth;
    var h = this.element.clientHeight;
    wrapper.style.width = w+"px";
    wrapper.style.height = h+"px";
    this.wrapper = wrapper;

    this.wrapper.style.transformStyle = "preserve-3d";
    this.wrapper.style.transition = "transform 0.35s ease-out";

    this.initialize();

    window.addEventListener("keydown", function(ev){
      switch(ev.key){
          case 'ArrowRight':
          this.next();
          break;
          case 'ArrowLeft':
          this.previous();
          break;
      }
    }.bind(this));
  }
  
  next(){
    if(this.orientation == "vertical"){
      this.rotX += this.angle;
    }else{
      this.rotY += this.angle;
    }
    this.wrapper.style.transform = "translateZ("+(-40 + this.distZ * -1)+"px)rotateX("+this.rotX+"deg)rotateY("+this.rotY+"deg)rotateZ("+this.rotZ+"deg)";
    setTimeout(function(){
      this.wrapper.style.transform = "translateZ("+(this.distZ * -1)+"px)rotateX("+this.rotX+"deg)rotateY("+this.rotY+"deg)rotateZ("+this.rotZ+"deg)";
    }.bind(this), 200);
  }
  
  previous(){
    if(this.orientation == "vertical"){
      this.rotX -= this.angle;
    }else{
      this.rotY -= this.angle;
    }
    this.wrapper.style.transform = "translateZ("+(-40+this.distZ * -1)+"px)rotateX("+this.rotX+"deg)rotateY("+this.rotY+"deg)rotateZ("+this.rotZ+"deg)";
    setTimeout(function(){
      this.wrapper.style.transform = "translateZ("+(this.distZ * -1)+"px)rotateX("+this.rotX+"deg)rotateY("+this.rotY+"deg)rotateZ("+this.rotZ+"deg)";
    }.bind(this), 200);
  }

  resizeID = null;
  resizeID2 = null;
  onresize(){
    clearTimeout(this.resizeID);
    this.resizeID = setTimeout(this.initialize.bind(this), 50);
    clearTimeout(this.resizeID2);
    this.resizeID2 = setTimeout(this.initialize.bind(this), 70);
  }

  initialize(){
    let dir = parseInt(this.direction);
    let angle = dir * 360 / this.faceCount;
    let size = this.orientation == "vertical" ? this.faces[0].clientHeight : this.faces[0].clientWidth;
    let distZ = ((size / 2) / Math.tan(Math.PI / this.faceCount));
    this.distZ = distZ;
    this.angle = angle;


    var w = this.element.clientWidth;
    var h = this.element.clientHeight;
    this.wrapper.style.transition = "all 0.1s linear";
    this.wrapper.style.width = w+"px";
    this.wrapper.style.height = h+"px";
    
    for(let i = 0; i < this.faceCount; i++){
      let face = this.faces[i];
      let rot = -this.angle * i;
      face.style.position = "absolute";
      face.style.transform = (this.orientation == 'vertical' ? 'rotateX(' : 'rotateY(') + rot + "deg)"+" translateZ("+ (this.distZ) +"px)";
    }
    this.wrapper.style.transform = "translateZ("+(this.distZ * -1)+"px)rotateX("+this.rotX+"deg)rotateY("+this.rotY+"deg)rotateZ("+this.rotZ+"deg)";
    this.wrapper.style.transition = "transform 0.35s ease-out";
  }
}
