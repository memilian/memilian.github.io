import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { LerpService } from 'services/lerp-service';
import { getSlider } from 'simple-slider';

@inject(EventAggregator, LerpService)
export class ScreenProject{
  displayTitle="Projets"
  title;
  description;
  cover;
  sliders = [];
  constructor(ea, ls){
    this.lerpService = ls;
    this.ea = ea;
    this.projectData = [
      {
        name : "The underworld",
        description1 : "<p>Un mod pour le jeu <strong>Minecraft</strong>. Le mod (plugin) ajoute une dimension souterraine au jeu, un boss, des ennemis et de nombreux objets.</p><p>Ce projet m'a donné goût au développement et m'a beaucoup appris.</p>",
        description2 : "<ul><li>POO en JAVA</li><li>Naviguer dans une grande base de code</li><li>Résolution de bogues</li><li>Génération procédurale</li></ul>",
        coverClass: "image-wrapper",
        cover: ["img/mc1.jpg", "img/mc2.jpg", "img/mc4.jpg"]
      },
      {
        name : "Java Voxel engine",
        description1 : "<p>Un Voxel engine en <strong>Java</strong>, réalisé avec le moteur de jeu JMonkey 3. Affiche un terrain infini généré de façon procédurale.</p><p> Le moteur supporte : </p><ul><li>Ajout / suppression de blocks dans un volume</li><li>Générations de différents types de terrain</li><li>Ambient occlusion par voxel</li><li>Aucune limite de construction verticale</li></ul>",
        description2 : "<ul><li>POO en Java</li><li>Fonctionnement de la pipeline graphique</li><li>Programmation concurrente</li><li>Shaders GLSL</li><li>Concepts de génération procédurale</li></ul>",
        coverClass: "image-wrapper",
        cover: ["img/vox1.jpg", "img/vox2.jpg", "img/vox3.jpg", "img/vox4.jpg", "img/vox5.jpg"]
      },
      {
        name : "Yasis",
        description1 : "<p>Un jeu web de type shooter, développé en <strong>Haxe</strong>.</p><p>Le projet a été réalisé en mode agile, avec plusieurs courtes itérations.</p>",
        description2 : "<ul><li>Paradigme entité / composants</li><li>Fonctionnement et optimisation de la pipeline graphique</li><li>Shaders GLSL</li><li>Game design</li><li>Haxe</li></ul>",
        coverClass: "image-wrapper vertical",
        cover: ["img/yas0.jpg", "img/yas1.jpg", "img/yas2.jpg", "img/yas3.jpg", "img/yas4.jpg", "img/yas5.jpg", "img/yas6.jpg", "img/yas7.jpg"]
      },
      {
        name : "Game Jam",
        description1 : "<p>Jeu intitulé <em>\"Save your diamond factory\"</em>, intégralement réalisé en 72h lors de l'évènement Ludum Dare 40 ayant pour thème : </p><p> <em>\"The more you have, the worse it gets\".</em></p><br/><p>Le jeu mixe les genres de Tower Defense et de jeu incrémental.</p>",
        description2 : "<ul><li>Organisation</li><li>Prototypage dans un court laps de temps</li><li>Paradigme entité / composants</li><li>Game design</li></ul>",
        coverClass: "image-wrapper",
        cover: ["img/ld40.jpg"]
      }
    ]
  }

  nextProject(){
    this.title.au["polygon-transition"].viewModel.next();
    this.description.au["polygon-transition"].viewModel.next();
    this.cover.au["polygon-transition"].viewModel.next();
  }
  
  previousProject(){
    this.title.au["polygon-transition"].viewModel.previous();
    this.description.au["polygon-transition"].viewModel.previous();
    this.cover.au["polygon-transition"].viewModel.previous();
  }

  attached(){
    let sliderElements = document.querySelectorAll('*[data-simple-slider]');
    for(let slider of sliderElements){
      let children = slider.querySelectorAll('img');
      this.sliders.push(getSlider({
        container: slider,
        children: children,
        duration: .5,
        delay: 3.5,
        end: -100,
        init: 100,
        ease: function(time, begin, change, duration) {
          return change * ((time = time / duration - 1) * time * time + 1) + begin;
        },
        onChange: function(prev, index){
          let controls = slider.querySelectorAll(".cover-control");
          for(let c of controls){
            c.classList.remove('active');
          }
          controls[index].classList.add('active');
        }
      }));
      this.sliders[this.sliders.length-1].change(0);
    }
    this.ea.subscribe('resize', this.onresize.bind(this));
    setTimeout(this.onresize.bind(this), 1000);
    window.advanceProgress();
  }

  changeSlider(event, project, index){
    this.sliders[this.projectData.indexOf(project)].change(index);
  }

  verticalImageStyle = ".vertical img{margin-left:calc(50% - "+320+"px);}";
  eachImageWrapper = [];
  onresize(){
    let verticalImages = document.querySelectorAll('.image-wrapper.vertical img');
    
    let adjustControls = function(){
      for(let wrapper of this.eachImageWrapper){
        let images = wrapper.querySelectorAll('img');
        let h = images[0].clientHeight;
        let control = wrapper.querySelector('.cover-control-container');
        control.style.top = 'calc('+h+'px - 20px)';
      }
      let w = verticalImages[0].clientWidth / 2;
      this.verticalImageStyle = ".vertical img{margin-left:calc(50% - "+w+"px);}"
    }.bind(this);
    setTimeout(adjustControls, 450);
    adjustControls();
  }

  activate(data){
    this.index = data.index;
  }
}
