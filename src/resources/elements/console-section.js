import {inject, customElement} from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class ConsoleSection{
  
  state = 0;
  lines = [
    "Bonjour,",
    "Je m'appelle Mathieu Emilian",
    "Je suis développeur",
    "J'aime travailler sur des projets créatifs", " "
  ];

  _console;
  carret;
  carretInterval;
  typingInterval;
  typingSpeed = 35;
  linePauseDuration = 700;

  currentLineIdx = 0;
  currentCharIdx = 0;
  linesElements = [];
  canStart = false;

  constructor(ea){
    this.ea = ea;
  }
 
  attached(){
    this.linesElements = this._console.getElementsByClassName('line');
    this.typingInterval = setInterval(this.type.bind(this), this.typingSpeed);
    this.carret.parentElement.removeChild(this.carret);
    this.linesElements[0].appendChild(this.carret);
    this.ea.subscribe('app-ready', function(){
      window.setTimeout(function(){
        this.canStart = true;
      }.bind(this), 800);
    }.bind(this));
  }

  createCharSpan(char){
    let span = document.createElement("span");
    if(char != " ")
      span.classList.add('console-letter');
    span.textContent = char;

    return span;
  }

  startWordSwitch(){
    this.words = [];
    let oldWord = document.getElementsByClassName('strong-word')[2];
    while(oldWord.childElementCount > 0) oldWord.firstChild.remove();
    let i = 0;
    for(let word of ["créatifs   ", "interactifs", "innovants  "]){
      let wordElement = document.createElement('span');
      wordElement.classList.add('word-switch');
      for(let char of word){
        let span = this.createCharSpan(char);
        wordElement.appendChild(span);
        span.style.transform = i == 0 ? "rotateX(0deg)" : i == 1 ? "rotateX(90deg)" : "rotateX(-90deg)";
      }
      oldWord.appendChild(wordElement);
      this.words.push(wordElement);
      i++;
    }
    this.wordSwitchInterval = setInterval(this.wordSwitch.bind(this), 1500);
    this.wordSwitch();
  }

  currentWordIdx = 0;
  wordSwitch(){
    let nextWordIdx = (this.currentWordIdx + 1) % 3;
    let i = 0;
    for(let child of this.words[this.currentWordIdx].children){
      child.style.transformOrigin = 'bottom';
      setTimeout( () => child.style.transform = 'rotateX(-90deg)', i++*60);    
    }
    i = 0;
    for(let child of this.words[nextWordIdx].children){
      child.style.transformOrigin = 'top';
      setTimeout( () => child.style.transform = 'rotateX(0deg)', i++*60);
    }
    this.currentWordIdx = nextWordIdx;
  }

  pauseTimer = 0;
  parentOverride = null;
  type(){
    //pause between each line
    if(this.paused && Date.now() - this.pausedTime > this.linePauseDuration){
      this.paused = false;
    }

    if(!this.canStart || this.paused) return;

    //stop typing
    if(this.currentLineIdx >= this.lines.length){
      this.paused = true;
      clearInterval(this.typingInterval);
      this.blink();
      this.carretInterval = setInterval(this.blink.bind(this), 1200);
      this.startWordSwitch();
      let letters = document.getElementsByClassName("console-letter");
      for(let letter of letters){
        if(letter.parentElement.classList.contains('word-switch')) continue;
        letter.addEventListener('mouseover', function(ev){
          let dx = Math.floor(Math.random() * 100 - 50);
          let dy = Math.floor(Math.random() * 100 - 50);
          letter.style.transform = 'translate('+dx+'px,'+dy+'px)';
          setTimeout(function(){
            letter.style.transform='translate(0,0)';
          },1200);
        });
      }
      this.ea.publish('typing-finished');
      return;
    }

    //watch for next line
    if(this.currentCharIdx >= this.lines[this.currentLineIdx].length){
      this.currentLineIdx++;
      this.currentCharIdx = 0;
      this.paused = true;
      this.pausedTime = Date.now();
      this.parentOverride = null;
      return;
    }

    //create and append current char
    let line = this.lines[this.currentLineIdx];
    let parent = this.linesElements[this.currentLineIdx];
    if(this.currentLineIdx === 1 && line.substring(this.currentCharIdx) == "Mathieu Emilian"
    || this.currentLineIdx === 2 && line.substring(this.currentCharIdx) == "développeur"
    || this.currentLineIdx === 3 && line.substring(this.currentCharIdx) == "créatifs"){
      let highlightContainer = document.createElement('span');
      highlightContainer.classList.add('strong-word');
      parent.appendChild(highlightContainer);
      this.parentOverride = highlightContainer;
    }
    if(this.parentOverride != null) parent = this.parentOverride;
    let char = line.charAt(this.currentCharIdx);
    let span = this.createCharSpan(char);
    parent.appendChild(span);
    
    //move carret
    this.carret.parentElement.removeChild(this.carret);
    this.linesElements[this.currentLineIdx].appendChild(this.carret);
    this.currentCharIdx++;
  }

  //carret blink
  blink(){
    if(!this.paused){
      this.carret.style.opacity = 1;
      return;      
    }
    this.carret.style.opacity = 0;
    setTimeout(function(){
      this.carret.style.opacity = 1;
    }.bind(this), 600)
  }

}
