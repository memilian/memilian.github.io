import * as THREE from "three";
import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import {TrackballControls} from '../TrackballControls';
import {ConvolutionShader} from '../threefix/shaders/ConvolutionShader';
import {CopyShader} from '../threefix/shaders/CopyShader';
import {FilmShader} from '../threefix/shaders/FilmShader';
import {FocusShader} from '../threefix/shaders/FocusShader';
import {BloomPass} from '../threefix/postprocessing/BloomPass';
import {FilmPass} from '../threefix/postprocessing/FilmPass';
import {MaskPass} from '../threefix/postprocessing/MaskPass';
import {RenderPass} from '../threefix/postprocessing/RenderPass';
import {ShaderPass} from '../threefix/postprocessing/ShaderPass';
import {EffectComposer} from '../threefix/postprocessing/EffectComposer';
import * as Detector from "../Detector";
import { LerpService } from "services/lerp-service";

@inject(EventAggregator, LerpService)
export class ScreenSkills {
  displayTitle="Compétences"
  
  container = null;
  eventAggregator;

  inited = false;
  ready = false;
  paused = true;
  canStart = false;

  constructor(ea, lerp){
    this.lerpService = lerp;
    this.eventAggregator = ea;
    this.eventAggregator.subscribe('resize', this.onresize.bind(this));
    this.eventAggregator.subscribe("app-ready", function(){this.canStart = true;}.bind(this));
    if ( ! Detector.webgl ) Detector.addGetWebGLMessage({parent: this.container});
    this.font = null;
    let loadManager = new THREE.LoadingManager();
    let loader = new THREE.FontLoader(loadManager);
    this.discSprite = new THREE.TextureLoader(loadManager).load( 'img/disc.png' );
    loader.load('fonts/roboto.json', function(font) {
      this.font = font;
    }.bind(this));
    loadManager.onLoad = function(){
      this.ready = true;
      window.advanceProgress();
    }.bind(this);
    window.addEventListener('scroll', this.onscroll.bind(this));
  }

  activate(data){
    this.index = data.index;
  }

  onresize(size){
    if(this.inited){
      let w = this.container.clientWidth;
      let h = size.h;
      this.renderer.setSize(w, h);
      this.camera.aspect = w/h;
      this.camera.updateProjectionMatrix();
      this.controls.handleResize();
      this.composer.reset();
    }
  }

  onscroll(){
    let top = this.container.offsetTop;
    let bot = this.container.offsetTop + this.container.offsetHeight;
    let screenTop =(window.pageYOffset || document.scrollTop)  - (document.clientTop || 0) || 0;
    let screenBot = screenTop + window.innerHeight;

    if((screenBot >= top) && (screenTop <= bot)){
      this.paused = false;
      window.removeEventListener('scroll', this.onscroll.bind(this));
    }
    else {
      this.paused = true;
    }
  }

  attached(){
    let watchReady = null;
    setInterval(function(){
      if(this.ready && !this.inited && this.container != null && this.canStart){
        this.startScene();
        clearInterval(watchReady);
      }
    }.bind(this), 25);
  }

  startScene(){
    //setup
    this.textColor = new THREE.Color(0x5D0359);
    this.hoverTextColor = new THREE.Color(0xFFFF00);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, this.container.clientWidth / window.innerHeight, 0.1, 1000 );
    this.renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( this.container.clientWidth, this.container.clientHeight );
    this.renderer.setClearColor(0xffffff, 0);
    this.renderer.autoClear = false;
    this.container.appendChild( this.renderer.domElement );

    //postprocessing
    var renderModel = new THREE.RenderPass( this.scene, this.camera );
    var effectBloom = new THREE.BloomPass(1.5, 25, undefined, 512);
    effectBloom.autoclear = false;
    var effectCopy = new THREE.ShaderPass( THREE.CopyShader );
    effectCopy.renderToScreen = true;
    var composer = new THREE.EffectComposer(this.renderer);
    composer.addPass( renderModel );
    composer.addPass( effectBloom );
    composer.addPass( effectCopy );
    effectCopy.clear = true;
    this.composer = composer;
    
    //create base geometry
    var skillsIco = new THREE.IcosahedronBufferGeometry(1, 5);
    // skillsIco.mergeVertices();
    // var mergedBufferGeom = new THREE.BufferGeometry().fromGeometry(skillsIco);
    // skillsIco = mergedBufferGeom;
    skillsIco.attributes.position.dynamic = true;
    var colors = [];
    var vertForces = [];
    for(let p = 0; p < skillsIco.attributes.position.count; p++){
      colors.push(0.0282,0.3718,0.6);
      vertForces[p] = [];
    }
    skillsIco.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) )
    skillsIco.attributes.color.dynamic = true;

    //skills infos
    let nskill = 0;
    let getSkillInfos = function(name, value){
      return {
        name: name,
        position:[],
        value: value,
        lines: [],
        text: null,
        verticesInfos: [],
        curIdx:[],
        nextVert: 0,
        startTime: 500*nskill++,
        hovered: false
      }
    }
    var skills = [
      getSkillInfos("HTML5", 80),
      getSkillInfos("CSS3", 80),
      getSkillInfos("Javascript ES5/ES6", 70),
      getSkillInfos("UML", 45),
      getSkillInfos("Java", 65),
      getSkillInfos("JavaFx", 40),
      getSkillInfos("C#", 50),
      getSkillInfos("GLSL", 45),
      getSkillInfos("git", 65),
      getSkillInfos("SQL", 45),
      getSkillInfos("Aurelia", 70)
    ];

    //fibonacci sphere
    var offset = 2.0 / skills.length;
    var increment = Math.PI * (3 - Math.sqrt(5));
    for(let i = 0; i < skills.length; i++){
      var y = ((i * offset) - 1 ) + (offset * 0.5);
      var r = Math.sqrt( 1 - Math.pow(y, 2));
      var phi = ((i) % skills.length) * increment;

      var x = Math.cos(phi) * r;
      var z = Math.sin(phi) * r;
      skills[i].position = [x,y,z];
    }
    
    let	lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, vertexColors: THREE.VertexColors } );
    let	textMaterial = new THREE.MeshLambertMaterial( { color: 0x5D0359} );
    
    //generate each skill 
    var rad = 0.6;
    for(let j = 0; j < skills.length; j++){

      // var sp = new THREE.SphereGeometry(rad, 32, 32);
      // var spm = new THREE.Mesh(sp, new THREE.MeshBasicMaterial({color: new THREE.Color(1,0,0), opacity:0.05, transparent: true}));
      // spm.position.fromArray(skills[j].position);
      // this.scene.add(spm);

      var pos = skillsIco.attributes.position;
      var posVec = new THREE.Vector3(skills[j].position[0], skills[j].position[1], skills[j].position[2]);

      skills[j].vertices = [];
      skills[j].rad = rad;
      //compute vertices deformation
      for(let p = 0; p < pos.count; p++){
        var vertx = pos.getX(p);
        var verty = pos.getY(p);
        var vertz = pos.getZ(p);
        
        var distSq = posVec.distanceToSquared(new THREE.Vector3(vertx, verty, vertz));
        if(distSq < rad * rad){
          if(vertx == 0) vertx =  0.00001;
          var theta = Math.acos(vertz);
          var phi = Math.atan(verty / (vertx));
          var skillVal = skills[j].value / 100;
          var normDist = 1 - distSq / (rad * rad);
          skills[j].verticesInfos.push({
            id: p,
            dist: normDist,
            timeStarted: null
          });

          var newRad = this.lerp(1, 1 + ( skillVal), normDist * normDist * normDist * normDist * normDist * normDist * normDist);

          if(vertx < 0) {
            theta = Math.PI * 2 - theta;
          }
          vertForces[p].push({
            pos: new THREE.Vector3(
              newRad * Math.sin(theta) * Math.cos(phi),
              newRad * Math.sin(theta) * Math.sin(phi),
              newRad * Math.cos(theta)
            ),
            power: skillVal,
            dist: normDist
          });
        }
      }
      skills[j].verticesInfos.sort(function(a,b) {return a.dist-b.dist;});

      let center = skills[j].position;
      let length = 2 + 0.5 * Math.random();
      let end = new THREE.Vector3(length * center[0], length * center[1], length * center[2]);
      //create lines
      for(let l = 0; l < 4; l++){
        let lineGeom = new THREE.BufferGeometry();
        lineGeom.addAttribute( 'position', new THREE.Float32BufferAttribute( [0,0,0, end.x, end.y, end.z ], 3 ) );
        lineGeom.addAttribute( 'color', new THREE.Float32BufferAttribute( [1,0,0,1,0,0], 3 ) );
        lineGeom.attributes.position.dynamic = true;
        let line = new THREE.Line(lineGeom, lineMaterial);
        skills[j].lines.push(line);
        this.scene.add(line);
      }

      //create text
      let textGeometry = new THREE.TextBufferGeometry(skills[j].name, {font: this.font});
      let sc = 0.0015;
      textGeometry.scale(sc,sc,sc/10);
      textGeometry.computeBoundingBox();
      let text = new THREE.Mesh(textGeometry, new THREE.MeshLambertMaterial( { color: this.textColor.clone()} ));
      textGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(-text.geometry.boundingBox.getSize(new THREE.Vector3()).x * 0.5,0,0));
      text.position.set(end.x, end.y, end.z);
      let bb = textGeometry.boundingBox;
      let bbg = new THREE.BoxGeometry(bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z);
      let bbm = new THREE.Mesh(bbg, new THREE.MeshBasicMaterial({transparent: true, opacity: 0}));
      bbm.position.y = 0.06;
      text.add(bbm)
      this.scene.add(text);
      
      skills[j].text = text;
    }

    

    //normalize and store vertices deformation
    this.desiredPos = [];
    for(let p = 0; p < pos.count; p++){
      let sum = new THREE.Vector3();
      if(vertForces[p].length == 0){
        sum.set(pos.getX(p), pos.getY(p), pos.getZ(p));
      }else if(vertForces[p].length == 2){
        let p1 = vertForces[p][0].pos;
        let p2 = vertForces[p][1].pos;
        sum = sum.add(p1);
        sum = sum.add(p2);
        sum = sum.divideScalar(2);
      }else{
        sum = vertForces[p][0].pos;
      }
      this.desiredPos[p] = sum;
    }
    skillsIco.attributes.position.needsUpdate = true;
    skillsIco.attributes.color.needsUpdate = true;

    this.skillsOriginalPos = skillsIco.attributes.position.clone();

    this.discSprite.premultiplyAlpha = true;
    var material = new THREE.PointsMaterial( { map: this.discSprite, vertexColors: THREE.VertexColors, size: 0.04,  opacity: 1.0, transparent: true} );
    material.alphaTest = 0.2;
    this.skillsIcoMesh = new THREE.Points(skillsIco, material);

    this.light = new THREE.PointLight(0xffffff, 1);
    this.ambientLight = new THREE.AmbientLight(0xffffff, .8);

    let controls = new THREE.TrackballControls( this.camera, this.container);
    controls.rotateSpeed = 3.0;
    controls.zoomSpeed = 1.2;
    controls.noZoom = false;
    controls.noPan = true;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.09;
    controls.keys = [ 65, 83, 68 ];

    this.controls = controls;
    this.skills = skills;

    this.controls.addEventListener('change', function(){
      this.light.position.copy(this.camera.position);
    }.bind(this));

    this.scene.add( this.ambientLight );
    this.scene.add( this.light );
    this.scene.add( this.skillsIcoMesh );

    var greySphere = new THREE.SphereGeometry(0.98, 64, 64);
    var mat = new THREE.MeshBasicMaterial({color:new THREE.Color(0.008, 0.008, 0.008)});
    this.scene.add(new THREE.Mesh(greySphere, mat));

    var outerSphere = new THREE.SphereGeometry(150,64,64);
    var r = 0.401833255;
    var mat2 = new THREE.MeshBasicMaterial({color:new THREE.Color(r * 0.2627450980392157, r * 0.25882352941176473, r * 0.2627450980392157), side: THREE.DoubleSide});
    this.scene.add(new THREE.Mesh(outerSphere, mat2));

    this.raycaster = new THREE.Raycaster();
    // let lineGeom = new THREE.BufferGeometry();
    // lineGeom.addAttribute( 'position', new THREE.Float32BufferAttribute( [0,0,0, 0,0,3 ], 3 ) );
    // lineGeom.addAttribute( 'color', new THREE.Float32BufferAttribute( [0,1,0,0,1,0], 3 ) );
    // lineGeom.attributes.position.dynamic = true;
    // this.rayLine = new THREE.Line(lineGeom, lineMaterial);
    // this.scene.add(this.rayLine);

    this.camera.position.z = 4;
    this.timeStarted = Date.now();
    this.lastUpdate = Date.now();
    this.mouse = {x:0, y:0};
    this.renderer.domElement.addEventListener('mousemove', this.onmousemove.bind(this), false);
    this.renderer.domElement.addEventListener('mouseup', this.onmouseclick.bind(this), false);
    this.inited = true;
    this.update();
  }

  mouseJustPressed = false;
  onmouseclick(event){
    event.preventDefault();
    this.mouseJustPressed = true;
  }

  onmousemove(event){
    event.preventDefault();
    this.mouse.x = ((event.clientX-8) / this.renderer.domElement.clientWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
  }

  timeStarted;
  lastUpdate;
  totalTime = 0.0;
  dt;
  startAt = 0;
  update(){
    if(!this.paused){
      let now = Date.now();
      this.dt = now - this.lastUpdate;
      this.lastUpdate = now;
      this.totalTime += this.dt;

      this.controls.update();

      for(let skill of this.skills){
        let lastVertice = skill.verticesInfos[skill.verticesInfos.length -1 ];
        if(this.totalTime < skill.startTime || lastVertice.timeStarted != null && (this.totalTime - lastVertice.timeStarted > 2000)) continue;
        let j = 0
        while(skill.nextVert < skill.verticesInfos.length && j++ < 15){
          skill.verticesInfos[skill.nextVert++].timeStarted = this.totalTime;
        }
        for(let i = this.startAt; i < skill.nextVert; i++){
          let vert = skill.verticesInfos[i];
          let vertId = vert.id;
          
          let posCoef = (this.totalTime - vert.timeStarted) / 750;
          posCoef = 3 * posCoef * (1-posCoef) * (1-posCoef);
          if(posCoef > 1) posCoef = 1;
          this.skillsIcoMesh.geometry.attributes.position.setX(vertId, this.lerp(this.skillsOriginalPos.getX(vertId), this.desiredPos[vertId].x, posCoef));
          this.skillsIcoMesh.geometry.attributes.position.setY(vertId, this.lerp(this.skillsOriginalPos.getY(vertId), this.desiredPos[vertId].y, posCoef));
          this.skillsIcoMesh.geometry.attributes.position.setZ(vertId, this.lerp(this.skillsOriginalPos.getZ(vertId), this.desiredPos[vertId].z, posCoef));
          
          let colCoef = (this.totalTime - vert.timeStarted) / 2000;
          if(colCoef > 1) colCoef = 1;
          colCoef = 6.7*colCoef * (1-colCoef)* (1-colCoef);
          this.skillsIcoMesh.geometry.attributes.color.setX(vertId, this.lerp(0.0282, 1, colCoef));
          this.skillsIcoMesh.geometry.attributes.color.setY(vertId, this.lerp(0.3718, 1, colCoef));
          this.skillsIcoMesh.geometry.attributes.color.setZ(vertId, this.lerp(0.6, 1, colCoef));
          if(colCoef >= 1) this.startAt = i;
        }
      }

      //update text orientation
      for(let sk of this.skills){
        sk.text.quaternion.copy(this.camera.quaternion);
      }

      let bounce = function(skill){
        let loop = true;
        let i = skill.verticesInfos.length;
        let range = 25;
        while(loop){
          if(i <0 ) break;
          let end = i;
          let start = Math.max(0, i - range);
          this.lerpService.addEasing(function(t){
            t = 7 * t * (1-t) * (1-t);
            if(t > 1) t = 1;
            for(let j = start; j < end; j++){
              let vert = skill.verticesInfos[j];
              let vertId = vert.id;
              this.skillsIcoMesh.geometry.attributes.position.setX(vertId, this.lerp(this.skillsOriginalPos.getX(vertId), this.desiredPos[vertId].x, 1-t));
              this.skillsIcoMesh.geometry.attributes.position.setY(vertId, this.lerp(this.skillsOriginalPos.getY(vertId), this.desiredPos[vertId].y, 1-t));
              this.skillsIcoMesh.geometry.attributes.position.setZ(vertId, this.lerp(this.skillsOriginalPos.getZ(vertId), this.desiredPos[vertId].z, 1-t));

              // let colCoef = (this.totalTime - vert.timeStarted) / 2000;
              // if(colCoef > 1) colCoef = 1;
              // colCoef = 6.7*colCoef * (1-colCoef)* (1-colCoef);
              this.skillsIcoMesh.geometry.attributes.color.setX(vertId, this.lerp(0.0282, 1, t));
              this.skillsIcoMesh.geometry.attributes.color.setY(vertId, this.lerp(0.3718, 1, t));
              this.skillsIcoMesh.geometry.attributes.color.setZ(vertId, this.lerp(0.6, 1, t));
            }
          }, 1000, this, ~~((skill.verticesInfos.length - end) / range) * 10)
          i -= range;
        }
      }.bind(this);

      this.raycaster.setFromCamera(this.mouse, this.camera);
      for(let skill of this.skills){
        let isect = this.raycaster.intersectObject(skill.text, true);
        if(isect != null && isect.length > 0 && this.totalTime > 1000){
          if(!skill.hovered){
            skill.hovered = true;
            this.lerpService.addEasing(function(t){
                t = 1 - (1-t) * (1-t) * (1-t);
                skill.text.material.color.r = this.lerp(this.textColor.r, this.hoverTextColor.r, t);
                skill.text.material.color.g = this.lerp(this.textColor.g, this.hoverTextColor.g, t);
                skill.text.material.color.b = this.lerp(this.textColor.b, this.hoverTextColor.b, t);
            }, 500, this);
            bounce(skill);
          }
          if(this.mouseJustPressed){
            bounce(skill);
          }
        }else{
          if(skill.hovered){
            skill.hovered = false;
            this.lerpService.addEasing(function(t){
                t = t * t * t;
                skill.text.material.color.r = this.lerp(this.hoverTextColor.r, this.textColor.r, t);
                skill.text.material.color.g = this.lerp(this.hoverTextColor.g, this.textColor.g, t);
                skill.text.material.color.b = this.lerp(this.hoverTextColor.b, this.textColor.b, t);
            }, 500, this);
          }
        }
        this.skillsIcoMesh.geometry.attributes.position.needsUpdate = true;
        this.skillsIcoMesh.geometry.attributes.color.needsUpdate = true;
      }

      this.mouseJustPressed = false;
      // this.processEasings(this.dt);

      this.composer.render(0.01);
    }
    requestAnimationFrame(this.update.bind(this));
  }

  // addEasing(func, duration, delay = 0){
  //   setTimeout(function(){
  //     this.easingInfos.push({
  //       func: func.bind(this),
  //       started: this.totalTime,
  //       duration: duration
  //     });
  //   }.bind(this), delay);
  // }

  // easingInfos = [];
  // processEasings(){
  //   let toRemove = [];
  //   for(let ease of this.easingInfos){
  //     let t = (this.totalTime - ease.started) / ease.duration;
  //     if(t < 1){
  //       ease.func(t);
  //     }else{
  //       toRemove.push(ease);
  //     }
  //   }
  //   for(let rem of toRemove){
  //     this.easingInfos.splice(this.easingInfos.indexOf(rem), 1);
  //   }
  // }

  lerp(a, b, position) { return ((1.0 - position) * a) + (position * b); }

}
