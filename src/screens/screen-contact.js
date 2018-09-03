import {inject, NewInstance} from 'aurelia-framework';
import {Validator,
  ValidationController,
  ValidationControllerFactory,
  ValidationRules,
  validateTrigger,} from "aurelia-validation";

@inject(ValidationControllerFactory, Validator)
export class ScreenContact{
  displayTitle="Contact"
  index;

  fname;
  fnameError;
  lname;
  lnameError;
  email;
  emailError;
  message;
  messageError;
  
  canSubmit = false;

  constructor(controllerFactory, validator){
    this.validator = validator;
    this.controller = controllerFactory.createForCurrentScope();
    this.controller.validateTrigger = validateTrigger.changeOrBlur;
    this.controller.subscribe(event => this.validateAll());
    ValidationRules.ensure((c)=>c.fname).required().withMessage("Prénom est un champ requis")
      .ensure((c)=>c.lname).required().withMessage("Nom est un champ requis")
      .ensure((c)=>c.email).email().withMessage("Cet email n'est pas valide").required().withMessage("Email est un champ requis")
      .ensure((c)=>c.message).minLength(25).withMessage("Message trop court").required().withMessage("Message est un champ requis")
      .on(this);
  }

  attached(){
    this.validateAll();
  }

  validateAll(){
    this.validator.validateObject(this)
        .then(results => {
          this.canSubmit = results.every(result => result.valid)
          this.fnameError = "";
          this.lnameError = "";
          this.emailError = "";
          this.messageError = "";
          for(let error of this.controller.errors){
            this[error.propertyName+"Error"] = error.message;
          }
        });
    console.log(this.canSubmit);
  }

  activate(data){
    this.index = data.index;
    window.advanceProgress();
  }
}
