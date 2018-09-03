define('Detector',['module'], function (module) {
	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
		return typeof obj;
	} : function (obj) {
		return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	};

	var Detector = {

		canvas: !!window.CanvasRenderingContext2D,
		webgl: function () {

			try {

				var canvas = document.createElement('canvas');return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
			} catch (e) {

				return false;
			}
		}(),
		webgl2: function () {

			try {

				var canvas = document.createElement('canvas');return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
			} catch (e) {

				return false;
			}
		}(),
		workers: !!window.Worker,
		fileapi: window.File && window.FileReader && window.FileList && window.Blob,

		getWebGLErrorMessage: function getWebGLErrorMessage() {

			var element = document.createElement('div');
			element.id = 'webgl-error-message';
			element.style.fontFamily = 'monospace';
			element.style.fontSize = '13px';
			element.style.fontWeight = 'normal';
			element.style.textAlign = 'center';
			element.style.background = '#fff';
			element.style.color = '#000';
			element.style.padding = '1.5em';
			element.style.width = '400px';
			element.style.margin = '5em auto 0';

			if (!this.webgl) {

				element.innerHTML = window.WebGLRenderingContext ? ['Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />', 'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join('\n') : ['Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>', 'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join('\n');
			}

			return element;
		},

		addGetWebGLMessage: function addGetWebGLMessage(parameters) {

			var parent, id, element;

			parameters = parameters || {};

			parent = parameters.parent !== undefined ? parameters.parent : document.body;
			id = parameters.id !== undefined ? parameters.id : 'oldie';

			element = Detector.getWebGLErrorMessage();
			element.id = id;

			parent.appendChild(element);
		}

	};

	if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object') {

		module.exports = Detector;
	}
});
define('TrackballControls',['three'], function (_three) {
	'use strict';

	var THREE = _interopRequireWildcard(_three);

	function _interopRequireWildcard(obj) {
		if (obj && obj.__esModule) {
			return obj;
		} else {
			var newObj = {};

			if (obj != null) {
				for (var key in obj) {
					if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
				}
			}

			newObj.default = obj;
			return newObj;
		}
	}

	THREE.TrackballControls = function (object, domElement) {

		var _this = this;
		var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };

		this.object = object;
		this.domElement = domElement !== undefined ? domElement : document;

		this.enabled = true;

		this.screen = { left: 0, top: 0, width: 0, height: 0 };

		this.rotateSpeed = 1.0;
		this.zoomSpeed = 1.2;
		this.panSpeed = 0.3;

		this.noRotate = false;
		this.noZoom = false;
		this.noPan = false;

		this.staticMoving = false;
		this.dynamicDampingFactor = 0.2;

		this.minDistance = 0;
		this.maxDistance = Infinity;

		this.keys = [65, 83, 68];

		this.target = new THREE.Vector3();

		var EPS = 0.000001;

		var lastPosition = new THREE.Vector3();

		var _state = STATE.NONE,
		    _prevState = STATE.NONE,
		    _eye = new THREE.Vector3(),
		    _movePrev = new THREE.Vector2(),
		    _moveCurr = new THREE.Vector2(),
		    _lastAxis = new THREE.Vector3(),
		    _lastAngle = 0,
		    _zoomStart = new THREE.Vector2(),
		    _zoomEnd = new THREE.Vector2(),
		    _touchZoomDistanceStart = 0,
		    _touchZoomDistanceEnd = 0,
		    _panStart = new THREE.Vector2(),
		    _panEnd = new THREE.Vector2();

		this.target0 = this.target.clone();
		this.position0 = this.object.position.clone();
		this.up0 = this.object.up.clone();

		var changeEvent = { type: 'change' };
		var startEvent = { type: 'start' };
		var endEvent = { type: 'end' };

		this.handleResize = function () {

			if (this.domElement === document) {

				this.screen.left = 0;
				this.screen.top = 0;
				this.screen.width = window.innerWidth;
				this.screen.height = window.innerHeight;
			} else {

				var box = this.domElement.getBoundingClientRect();

				var d = this.domElement.ownerDocument.documentElement;
				this.screen.left = box.left + window.pageXOffset - d.clientLeft;
				this.screen.top = box.top + window.pageYOffset - d.clientTop;
				this.screen.width = box.width;
				this.screen.height = box.height;
			}
		};

		this.handleEvent = function (event) {

			if (typeof this[event.type] == 'function') {

				this[event.type](event);
			}
		};

		var getMouseOnScreen = function () {

			var vector = new THREE.Vector2();

			return function getMouseOnScreen(pageX, pageY) {

				vector.set((pageX - _this.screen.left) / _this.screen.width, (pageY - _this.screen.top) / _this.screen.height);

				return vector;
			};
		}();

		var getMouseOnCircle = function () {

			var vector = new THREE.Vector2();

			return function getMouseOnCircle(pageX, pageY) {

				vector.set((pageX - _this.screen.width * 0.5 - _this.screen.left) / (_this.screen.width * 0.5), (_this.screen.height + 2 * (_this.screen.top - pageY)) / _this.screen.width);

				return vector;
			};
		}();

		this.rotateCamera = function () {

			var axis = new THREE.Vector3(),
			    quaternion = new THREE.Quaternion(),
			    eyeDirection = new THREE.Vector3(),
			    objectUpDirection = new THREE.Vector3(),
			    objectSidewaysDirection = new THREE.Vector3(),
			    moveDirection = new THREE.Vector3(),
			    angle;

			return function rotateCamera() {

				moveDirection.set(_moveCurr.x - _movePrev.x, _moveCurr.y - _movePrev.y, 0);
				angle = moveDirection.length();

				if (angle) {

					_eye.copy(_this.object.position).sub(_this.target);

					eyeDirection.copy(_eye).normalize();
					objectUpDirection.copy(_this.object.up).normalize();
					objectSidewaysDirection.crossVectors(objectUpDirection, eyeDirection).normalize();

					objectUpDirection.setLength(_moveCurr.y - _movePrev.y);
					objectSidewaysDirection.setLength(_moveCurr.x - _movePrev.x);

					moveDirection.copy(objectUpDirection.add(objectSidewaysDirection));

					axis.crossVectors(moveDirection, _eye).normalize();

					angle *= _this.rotateSpeed;
					quaternion.setFromAxisAngle(axis, angle);

					_eye.applyQuaternion(quaternion);
					_this.object.up.applyQuaternion(quaternion);

					_lastAxis.copy(axis);
					_lastAngle = angle;
				} else if (!_this.staticMoving && _lastAngle) {

					_lastAngle *= Math.sqrt(1.0 - _this.dynamicDampingFactor);
					_eye.copy(_this.object.position).sub(_this.target);
					quaternion.setFromAxisAngle(_lastAxis, _lastAngle);
					_eye.applyQuaternion(quaternion);
					_this.object.up.applyQuaternion(quaternion);
				}

				_movePrev.copy(_moveCurr);
			};
		}();

		this.zoomCamera = function () {

			var factor;

			if (_state === STATE.TOUCH_ZOOM_PAN) {

				factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
				_touchZoomDistanceStart = _touchZoomDistanceEnd;
				_eye.multiplyScalar(factor);
			} else {

				factor = 1.0 + (_zoomEnd.y - _zoomStart.y) * _this.zoomSpeed;

				if (factor !== 1.0 && factor > 0.0) {

					_eye.multiplyScalar(factor);
				}

				if (_this.staticMoving) {

					_zoomStart.copy(_zoomEnd);
				} else {

					_zoomStart.y += (_zoomEnd.y - _zoomStart.y) * this.dynamicDampingFactor;
				}
			}
		};

		this.panCamera = function () {

			var mouseChange = new THREE.Vector2(),
			    objectUp = new THREE.Vector3(),
			    pan = new THREE.Vector3();

			return function panCamera() {

				mouseChange.copy(_panEnd).sub(_panStart);

				if (mouseChange.lengthSq()) {

					mouseChange.multiplyScalar(_eye.length() * _this.panSpeed);

					pan.copy(_eye).cross(_this.object.up).setLength(mouseChange.x);
					pan.add(objectUp.copy(_this.object.up).setLength(mouseChange.y));

					_this.object.position.add(pan);
					_this.target.add(pan);

					if (_this.staticMoving) {

						_panStart.copy(_panEnd);
					} else {

						_panStart.add(mouseChange.subVectors(_panEnd, _panStart).multiplyScalar(_this.dynamicDampingFactor));
					}
				}
			};
		}();

		this.checkDistances = function () {

			if (!_this.noZoom || !_this.noPan) {

				if (_eye.lengthSq() > _this.maxDistance * _this.maxDistance) {

					_this.object.position.addVectors(_this.target, _eye.setLength(_this.maxDistance));
					_zoomStart.copy(_zoomEnd);
				}

				if (_eye.lengthSq() < _this.minDistance * _this.minDistance) {

					_this.object.position.addVectors(_this.target, _eye.setLength(_this.minDistance));
					_zoomStart.copy(_zoomEnd);
				}
			}
		};

		this.update = function () {

			_eye.subVectors(_this.object.position, _this.target);

			if (!_this.noRotate) {

				_this.rotateCamera();
			}

			if (!_this.noZoom) {

				_this.zoomCamera();
			}

			if (!_this.noPan) {

				_this.panCamera();
			}

			_this.object.position.addVectors(_this.target, _eye);

			_this.checkDistances();

			_this.object.lookAt(_this.target);

			if (lastPosition.distanceToSquared(_this.object.position) > EPS) {

				_this.dispatchEvent(changeEvent);

				lastPosition.copy(_this.object.position);
			}
		};

		this.reset = function () {

			_state = STATE.NONE;
			_prevState = STATE.NONE;

			_this.target.copy(_this.target0);
			_this.object.position.copy(_this.position0);
			_this.object.up.copy(_this.up0);

			_eye.subVectors(_this.object.position, _this.target);

			_this.object.lookAt(_this.target);

			_this.dispatchEvent(changeEvent);

			lastPosition.copy(_this.object.position);
		};

		function keydown(event) {

			if (_this.enabled === false) return;

			window.removeEventListener('keydown', keydown);

			_prevState = _state;

			if (_state !== STATE.NONE) {

				return;
			} else if (event.keyCode === _this.keys[STATE.ROTATE] && !_this.noRotate) {

				_state = STATE.ROTATE;
			} else if (event.keyCode === _this.keys[STATE.ZOOM] && !_this.noZoom) {

				_state = STATE.ZOOM;
			} else if (event.keyCode === _this.keys[STATE.PAN] && !_this.noPan) {

				_state = STATE.PAN;
			}
		}

		function keyup(event) {

			if (_this.enabled === false) return;

			_state = _prevState;

			window.addEventListener('keydown', keydown, false);
		}

		function mousedown(event) {

			if (_this.enabled === false) return;

			event.preventDefault();
			event.stopPropagation();

			if (_state === STATE.NONE) {

				_state = event.button;
			}

			if (_state === STATE.ROTATE && !_this.noRotate) {

				_moveCurr.copy(getMouseOnCircle(event.pageX, event.pageY));
				_movePrev.copy(_moveCurr);
			} else if (_state === STATE.ZOOM && !_this.noZoom) {

				_zoomStart.copy(getMouseOnScreen(event.pageX, event.pageY));
				_zoomEnd.copy(_zoomStart);
			} else if (_state === STATE.PAN && !_this.noPan) {

				_panStart.copy(getMouseOnScreen(event.pageX, event.pageY));
				_panEnd.copy(_panStart);
			}

			document.addEventListener('mousemove', mousemove, false);
			document.addEventListener('mouseup', mouseup, false);

			_this.dispatchEvent(startEvent);
		}

		function mousemove(event) {

			if (_this.enabled === false) return;

			event.preventDefault();
			event.stopPropagation();

			if (_state === STATE.ROTATE && !_this.noRotate) {

				_movePrev.copy(_moveCurr);
				_moveCurr.copy(getMouseOnCircle(event.pageX, event.pageY));
			} else if (_state === STATE.ZOOM && !_this.noZoom) {

				_zoomEnd.copy(getMouseOnScreen(event.pageX, event.pageY));
			} else if (_state === STATE.PAN && !_this.noPan) {

				_panEnd.copy(getMouseOnScreen(event.pageX, event.pageY));
			}
		}

		function mouseup(event) {

			if (_this.enabled === false) return;

			event.preventDefault();
			event.stopPropagation();

			_state = STATE.NONE;

			document.removeEventListener('mousemove', mousemove);
			document.removeEventListener('mouseup', mouseup);
			_this.dispatchEvent(endEvent);
		}

		function mousewheel(event) {

			if (_this.enabled === false) return;

			if (_this.noZoom === true) return;

			event.preventDefault();
			event.stopPropagation();

			switch (event.deltaMode) {

				case 2:
					_zoomStart.y -= event.deltaY * 0.025;
					break;

				case 1:
					_zoomStart.y -= event.deltaY * 0.01;
					break;

				default:
					_zoomStart.y -= event.deltaY * 0.00025;
					break;

			}

			_this.dispatchEvent(startEvent);
			_this.dispatchEvent(endEvent);
		}

		function touchstart(event) {

			if (_this.enabled === false) return;

			switch (event.touches.length) {

				case 1:
					_state = STATE.TOUCH_ROTATE;
					_moveCurr.copy(getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
					_movePrev.copy(_moveCurr);
					break;

				default:
					_state = STATE.TOUCH_ZOOM_PAN;
					var dx = event.touches[0].pageX - event.touches[1].pageX;
					var dy = event.touches[0].pageY - event.touches[1].pageY;
					_touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt(dx * dx + dy * dy);

					var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
					var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
					_panStart.copy(getMouseOnScreen(x, y));
					_panEnd.copy(_panStart);
					break;

			}

			_this.dispatchEvent(startEvent);
		}

		function touchmove(event) {

			if (_this.enabled === false) return;

			event.preventDefault();
			event.stopPropagation();

			switch (event.touches.length) {

				case 1:
					_movePrev.copy(_moveCurr);
					_moveCurr.copy(getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
					break;

				default:
					var dx = event.touches[0].pageX - event.touches[1].pageX;
					var dy = event.touches[0].pageY - event.touches[1].pageY;
					_touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);

					var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
					var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
					_panEnd.copy(getMouseOnScreen(x, y));
					break;

			}
		}

		function touchend(event) {

			if (_this.enabled === false) return;

			switch (event.touches.length) {

				case 0:
					_state = STATE.NONE;
					break;

				case 1:
					_state = STATE.TOUCH_ROTATE;
					_moveCurr.copy(getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
					_movePrev.copy(_moveCurr);
					break;

			}

			_this.dispatchEvent(endEvent);
		}

		function contextmenu(event) {

			if (_this.enabled === false) return;

			event.preventDefault();
		}

		this.dispose = function () {

			this.domElement.removeEventListener('contextmenu', contextmenu, false);
			this.domElement.removeEventListener('mousedown', mousedown, false);
			this.domElement.removeEventListener('wheel', mousewheel, false);

			this.domElement.removeEventListener('touchstart', touchstart, false);
			this.domElement.removeEventListener('touchend', touchend, false);
			this.domElement.removeEventListener('touchmove', touchmove, false);

			document.removeEventListener('mousemove', mousemove, false);
			document.removeEventListener('mouseup', mouseup, false);

			window.removeEventListener('keydown', keydown, false);
			window.removeEventListener('keyup', keyup, false);
		};

		this.domElement.addEventListener('contextmenu', contextmenu, false);
		this.domElement.addEventListener('mousedown', mousedown, false);
		this.domElement.addEventListener('wheel', mousewheel, false);

		this.domElement.addEventListener('touchstart', touchstart, false);
		this.domElement.addEventListener('touchend', touchend, false);
		this.domElement.addEventListener('touchmove', touchmove, false);

		window.addEventListener('keydown', keydown, false);
		window.addEventListener('keyup', keyup, false);

		this.handleResize();

		this.update();
	};

	THREE.TrackballControls.prototype = Object.create(THREE.EventDispatcher.prototype);
	THREE.TrackballControls.prototype.constructor = THREE.TrackballControls;
});
define('app',['exports', 'aurelia-framework', 'aurelia-event-aggregator'], function (exports, _aureliaFramework, _aureliaEventAggregator) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.App = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var App = exports.App = (_dec = (0, _aureliaFramework.inject)(_aureliaEventAggregator.EventAggregator), _dec(_class = function () {
    function App(ea) {
      _classCallCheck(this, App);

      this.screens = [];
      this.screenRefs = [];
      this.resizeId = null;

      this.eventAggregator = ea;
      this.screenVms = ["screens/screen-desc", "screens/screen-projects", "screens/screen-skills", "screens/screen-cv", "screens/screen-contact"];
    }

    App.prototype.attached = function attached() {

      window.addEventListener('resize', this.resizeScreens.bind(this));

      var watchReady = null;
      watchReady = setInterval(function () {
        if (pbProgress >= 1.0) {
          setTimeout(function () {
            var loader = document.querySelector('.loader');
            if (loader != null) {
              loader.style.transition = "all 1s ease-in-out";
              loader.style.backgroundColor = "rgba(66,67,66,0)";
            }
            var segments = document.querySelectorAll('.circle-segment');
            for (var _iterator = segments, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
              var _ref;

              if (_isArray) {
                if (_i >= _iterator.length) break;
                _ref = _iterator[_i++];
              } else {
                _i = _iterator.next();
                if (_i.done) break;
                _ref = _i.value;
              }

              var s = _ref;

              s.style.transition = "all 1s ease-in-out";
              s.style.opacity = 0;
            }

            setTimeout(function () {
              stopLoader();
              this.resizeScreens();
              this.eventAggregator.publish("app-ready");
            }.bind(this), 1000);
          }.bind(this), 2000);

          setTimeout(function () {
            this.resizeScreens();
          }.bind(this), 1000);

          clearInterval(watchReady);
        }
      }.bind(this), 25);
    };

    App.prototype.resizeScreens = function resizeScreens() {
      clearTimeout(this.resizeId);
      this.resizeId = setTimeout(function () {
        this.eventAggregator.publish("resize", { w: window.innerWidth, h: window.innerHeight });
        this.screens = document.querySelectorAll('.screen');
        var h = window.innerHeight;
        for (var _iterator2 = this.screens, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
          var _ref2;

          if (_isArray2) {
            if (_i2 >= _iterator2.length) break;
            _ref2 = _iterator2[_i2++];
          } else {
            _i2 = _iterator2.next();
            if (_i2.done) break;
            _ref2 = _i2.value;
          }

          var sc = _ref2;

          sc.style.height = h + 'px';
        }
      }.bind(this), 40);
    };

    return App;
  }()) || _class);
});
define('environment',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    debug: true,
    testing: true
  };
});
define('main',['exports', './environment', 'aurelia-framework'], function (exports, _environment, _aureliaFramework) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.configure = configure;

  var _environment2 = _interopRequireDefault(_environment);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function configure(aurelia) {
    aurelia.use.standardConfiguration().feature('resources').plugin('aurelia-validation').globalResources([_aureliaFramework.PLATFORM.moduleName('./resources/elements/console-section')]).globalResources([_aureliaFramework.PLATFORM.moduleName('./resources/attributes/scroll-next')]).globalResources([_aureliaFramework.PLATFORM.moduleName('./resources/attributes/scroll-target')]).globalResources([_aureliaFramework.PLATFORM.moduleName('./resources/attributes/scroll-transform')]).globalResources([_aureliaFramework.PLATFORM.moduleName('./resources/attributes/polygon-transition')]).globalResources([_aureliaFramework.PLATFORM.moduleName('./resources/elements/menu-bar')]);

    if (_environment2.default.debug) {
      aurelia.use.developmentLogging();
    }

    if (_environment2.default.testing) {
      aurelia.use.plugin('aurelia-testing');
    }

    aurelia.start().then(function () {
      return aurelia.setRoot();
    });
  }
});
define('resources/index',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.configure = configure;
  function configure(config) {}
});
define('screens/screen-contact',["exports", "aurelia-framework", "aurelia-validation"], function (exports, _aureliaFramework, _aureliaValidation) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.ScreenContact = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var ScreenContact = exports.ScreenContact = (_dec = (0, _aureliaFramework.inject)(_aureliaValidation.ValidationControllerFactory, _aureliaValidation.Validator), _dec(_class = function () {
    function ScreenContact(controllerFactory, validator) {
      var _this = this;

      _classCallCheck(this, ScreenContact);

      this.displayTitle = "Contact";
      this.canSubmit = false;

      this.validator = validator;
      this.controller = controllerFactory.createForCurrentScope();
      this.controller.validateTrigger = _aureliaValidation.validateTrigger.changeOrBlur;
      this.controller.subscribe(function (event) {
        return _this.validateAll();
      });
      _aureliaValidation.ValidationRules.ensure(function (c) {
        return c.fname;
      }).required().withMessage("Prénom est un champ requis").ensure(function (c) {
        return c.lname;
      }).required().withMessage("Nom est un champ requis").ensure(function (c) {
        return c.email;
      }).email().withMessage("Cet email n'est pas valide").required().withMessage("Email est un champ requis").ensure(function (c) {
        return c.message;
      }).minLength(25).withMessage("Message trop court").required().withMessage("Message est un champ requis").on(this);
    }

    ScreenContact.prototype.attached = function attached() {
      this.validateAll();
    };

    ScreenContact.prototype.validateAll = function validateAll() {
      var _this2 = this;

      this.validator.validateObject(this).then(function (results) {
        _this2.canSubmit = results.every(function (result) {
          return result.valid;
        });
        _this2.fnameError = "";
        _this2.lnameError = "";
        _this2.emailError = "";
        _this2.messageError = "";
        for (var _iterator = _this2.controller.errors, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
          var _ref;

          if (_isArray) {
            if (_i >= _iterator.length) break;
            _ref = _iterator[_i++];
          } else {
            _i = _iterator.next();
            if (_i.done) break;
            _ref = _i.value;
          }

          var error = _ref;

          _this2[error.propertyName + "Error"] = error.message;
        }
      });
      console.log(this.canSubmit);
    };

    ScreenContact.prototype.activate = function activate(data) {
      this.index = data.index;
      window.advanceProgress();
    };

    return ScreenContact;
  }()) || _class);
});
define('screens/screen-cv',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var ScreenCv = exports.ScreenCv = function () {
    function ScreenCv() {
      _classCallCheck(this, ScreenCv);

      this.displayTitle = "CV";
    }

    ScreenCv.prototype.activate = function activate(data) {
      this.index = data.index;
      window.advanceProgress();
    };

    return ScreenCv;
  }();
});
define('screens/screen-desc',["exports", "aurelia-framework", "aurelia-event-aggregator"], function (exports, _aureliaFramework, _aureliaEventAggregator) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.ScreenDesc = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var ScreenDesc = exports.ScreenDesc = (_dec = (0, _aureliaFramework.inject)(_aureliaEventAggregator.EventAggregator), _dec(_class = function () {
    function ScreenDesc(ea) {
      _classCallCheck(this, ScreenDesc);

      this.displayTitle = "A propos";
      this.isChrome = false;

      this.ea = ea;
      this.isChrome = !!window.chrome && !!window.chrome.webstore;
      ea.subscribe("typing-finished", function () {
        this.portraitCrop.style.opacity = 1;
        this.portrait.style.filter = "blur(0px)";
        this.showKeys.style.opacity = 1;
        if (!this.isChrome) {
          this.chromeWarning.style.opacity = 1;
        }
      }.bind(this));
    }

    ScreenDesc.prototype.activate = function activate(data) {
      this.index = data.index;
      window.advanceProgress();
    };

    return ScreenDesc;
  }()) || _class);
});
define('screens/screen-projects',['exports', 'aurelia-framework', 'aurelia-event-aggregator', 'services/lerp-service', 'simple-slider'], function (exports, _aureliaFramework, _aureliaEventAggregator, _lerpService, _simpleSlider) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.ScreenProject = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var ScreenProject = exports.ScreenProject = (_dec = (0, _aureliaFramework.inject)(_aureliaEventAggregator.EventAggregator, _lerpService.LerpService), _dec(_class = function () {
    function ScreenProject(ea, ls) {
      _classCallCheck(this, ScreenProject);

      this.displayTitle = "Projets";
      this.sliders = [];
      this.verticalImageStyle = ".vertical img{margin-left:calc(50% - " + 320 + "px);}";
      this.eachImageWrapper = [];

      this.lerpService = ls;
      this.ea = ea;
      this.projectData = [{
        name: "The underworld",
        description1: "<p>Un mod pour le jeu <strong>Minecraft</strong>. Le mod (plugin) ajoute une dimension souterraine au jeu, un boss, des ennemis et de nombreux objets.</p><p>Ce projet m'a donné goût au développement et m'a beaucoup appris.</p>",
        description2: "<ul><li>POO en JAVA</li><li>Naviguer dans une grande base de code</li><li>Résolution de bogues</li><li>Génération procédurale</li></ul>",
        coverClass: "image-wrapper",
        cover: ["img/mc1.jpg", "img/mc2.jpg", "img/mc4.jpg"]
      }, {
        name: "Java Voxel engine",
        description1: "<p>Un Voxel engine en <strong>Java</strong>, réalisé avec le moteur de jeu JMonkey 3. Affiche un terrain infini généré de façon procédurale.</p><p> Le moteur supporte : </p><ul><li>Ajout / suppression de blocks dans un volume</li><li>Générations de différents types de terrain</li><li>Ambient occlusion par voxel</li><li>Aucune limite de construction verticale</li></ul>",
        description2: "<ul><li>POO en Java</li><li>Fonctionnement de la pipeline graphique</li><li>Programmation concurrente</li><li>Shaders GLSL</li><li>Concepts de génération procédurale</li></ul>",
        coverClass: "image-wrapper",
        cover: ["img/vox1.jpg", "img/vox2.jpg", "img/vox3.jpg", "img/vox4.jpg", "img/vox5.jpg"]
      }, {
        name: "Yasis",
        description1: "<p>Un jeu web de type shooter, développé en <strong>Haxe</strong>.</p><p>Le projet a été réalisé en mode agile, avec plusieurs courtes itérations.</p>",
        description2: "<ul><li>Paradigme entité / composants</li><li>Fonctionnement et optimisation de la pipeline graphique</li><li>Shaders GLSL</li><li>Game design</li><li>Haxe</li></ul>",
        coverClass: "image-wrapper vertical",
        cover: ["img/yas0.jpg", "img/yas1.jpg", "img/yas2.jpg", "img/yas3.jpg", "img/yas4.jpg", "img/yas5.jpg", "img/yas6.jpg", "img/yas7.jpg"]
      }, {
        name: "Game Jam",
        description1: "<p>Jeu intitulé <em>\"Save your diamond factory\"</em>, intégralement réalisé en 72h lors de l'évènement Ludum Dare 40 ayant pour thème : </p><p> <em>\"The more you have, the worse it gets\".</em></p><br/><p>Le jeu mixe les genres de Tower Defense et de jeu incrémental.</p>",
        description2: "<ul><li>Organisation</li><li>Prototypage dans un court laps de temps</li><li>Paradigme entité / composants</li><li>Game design</li></ul>",
        coverClass: "image-wrapper",
        cover: ["img/ld40.jpg"]
      }];
    }

    ScreenProject.prototype.nextProject = function nextProject() {
      this.title.au["polygon-transition"].viewModel.next();
      this.description.au["polygon-transition"].viewModel.next();
      this.cover.au["polygon-transition"].viewModel.next();
    };

    ScreenProject.prototype.previousProject = function previousProject() {
      this.title.au["polygon-transition"].viewModel.previous();
      this.description.au["polygon-transition"].viewModel.previous();
      this.cover.au["polygon-transition"].viewModel.previous();
    };

    ScreenProject.prototype.attached = function attached() {
      var _this = this;

      var sliderElements = document.querySelectorAll('*[data-simple-slider]');

      var _loop = function _loop() {
        if (_isArray) {
          if (_i >= _iterator.length) return 'break';
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) return 'break';
          _ref = _i.value;
        }

        var slider = _ref;

        var children = slider.querySelectorAll('img');
        _this.sliders.push((0, _simpleSlider.getSlider)({
          container: slider,
          children: children,
          duration: .5,
          delay: 3.5,
          end: -100,
          init: 100,
          ease: function ease(time, begin, change, duration) {
            return change * ((time = time / duration - 1) * time * time + 1) + begin;
          },
          onChange: function onChange(prev, index) {
            var controls = slider.querySelectorAll(".cover-control");
            for (var _iterator2 = controls, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
              var _ref2;

              if (_isArray2) {
                if (_i2 >= _iterator2.length) break;
                _ref2 = _iterator2[_i2++];
              } else {
                _i2 = _iterator2.next();
                if (_i2.done) break;
                _ref2 = _i2.value;
              }

              var c = _ref2;

              c.classList.remove('active');
            }
            controls[index].classList.add('active');
          }
        }));
        _this.sliders[_this.sliders.length - 1].change(0);
      };

      for (var _iterator = sliderElements, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        var _ret = _loop();

        if (_ret === 'break') break;
      }
      this.ea.subscribe('resize', this.onresize.bind(this));
      setTimeout(this.onresize.bind(this), 1000);
      window.advanceProgress();
    };

    ScreenProject.prototype.changeSlider = function changeSlider(event, project, index) {
      this.sliders[this.projectData.indexOf(project)].change(index);
    };

    ScreenProject.prototype.onresize = function onresize() {
      var verticalImages = document.querySelectorAll('.image-wrapper.vertical img');

      var adjustControls = function () {
        for (var _iterator3 = this.eachImageWrapper, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
          var _ref3;

          if (_isArray3) {
            if (_i3 >= _iterator3.length) break;
            _ref3 = _iterator3[_i3++];
          } else {
            _i3 = _iterator3.next();
            if (_i3.done) break;
            _ref3 = _i3.value;
          }

          var wrapper = _ref3;

          var images = wrapper.querySelectorAll('img');
          var h = images[0].clientHeight;
          var control = wrapper.querySelector('.cover-control-container');
          control.style.top = 'calc(' + h + 'px - 20px)';
        }
        var w = verticalImages[0].clientWidth / 2;
        this.verticalImageStyle = ".vertical img{margin-left:calc(50% - " + w + "px);}";
      }.bind(this);
      setTimeout(adjustControls, 450);
      adjustControls();
    };

    ScreenProject.prototype.activate = function activate(data) {
      this.index = data.index;
    };

    return ScreenProject;
  }()) || _class);
});
define('screens/screen-skills',['exports', 'three', 'aurelia-framework', 'aurelia-event-aggregator', '../TrackballControls', '../threefix/shaders/ConvolutionShader', '../threefix/shaders/CopyShader', '../threefix/shaders/FilmShader', '../threefix/shaders/FocusShader', '../threefix/postprocessing/BloomPass', '../threefix/postprocessing/FilmPass', '../threefix/postprocessing/MaskPass', '../threefix/postprocessing/RenderPass', '../threefix/postprocessing/ShaderPass', '../threefix/postprocessing/EffectComposer', '../Detector', 'services/lerp-service'], function (exports, _three, _aureliaFramework, _aureliaEventAggregator, _TrackballControls, _ConvolutionShader, _CopyShader, _FilmShader, _FocusShader, _BloomPass, _FilmPass, _MaskPass, _RenderPass, _ShaderPass, _EffectComposer, _Detector, _lerpService) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.ScreenSkills = undefined;

  var THREE = _interopRequireWildcard(_three);

  var Detector = _interopRequireWildcard(_Detector);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};

      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }

      newObj.default = obj;
      return newObj;
    }
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var ScreenSkills = exports.ScreenSkills = (_dec = (0, _aureliaFramework.inject)(_aureliaEventAggregator.EventAggregator, _lerpService.LerpService), _dec(_class = function () {
    function ScreenSkills(ea, lerp) {
      _classCallCheck(this, ScreenSkills);

      this.displayTitle = "Compétences";
      this.container = null;
      this.inited = false;
      this.ready = false;
      this.paused = true;
      this.canStart = false;
      this.mouseJustPressed = false;
      this.totalTime = 0.0;
      this.startAt = 0;

      this.lerpService = lerp;
      this.eventAggregator = ea;
      this.eventAggregator.subscribe('resize', this.onresize.bind(this));
      this.eventAggregator.subscribe("app-ready", function () {
        this.canStart = true;
      }.bind(this));
      if (!Detector.webgl) Detector.addGetWebGLMessage({ parent: this.container });
      this.font = null;
      var loadManager = new THREE.LoadingManager();
      var loader = new THREE.FontLoader(loadManager);
      this.discSprite = new THREE.TextureLoader(loadManager).load('img/disc.png');
      loader.load('fonts/roboto.json', function (font) {
        this.font = font;
      }.bind(this));
      loadManager.onLoad = function () {
        this.ready = true;
        window.advanceProgress();
      }.bind(this);
      window.addEventListener('scroll', this.onscroll.bind(this));
    }

    ScreenSkills.prototype.activate = function activate(data) {
      this.index = data.index;
    };

    ScreenSkills.prototype.onresize = function onresize(size) {
      if (this.inited) {
        var w = this.container.clientWidth;
        var h = size.h;
        this.renderer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.controls.handleResize();
        this.composer.reset();
      }
    };

    ScreenSkills.prototype.onscroll = function onscroll() {
      var top = this.container.offsetTop;
      var bot = this.container.offsetTop + this.container.offsetHeight;
      var screenTop = (window.pageYOffset || document.scrollTop) - (document.clientTop || 0) || 0;
      var screenBot = screenTop + window.innerHeight;

      if (screenBot >= top && screenTop <= bot) {
        this.paused = false;
        window.removeEventListener('scroll', this.onscroll.bind(this));
      } else {
        this.paused = true;
      }
    };

    ScreenSkills.prototype.attached = function attached() {
      var watchReady = null;
      setInterval(function () {
        if (this.ready && !this.inited && this.container != null && this.canStart) {
          this.startScene();
          clearInterval(watchReady);
        }
      }.bind(this), 25);
    };

    ScreenSkills.prototype.startScene = function startScene() {
      this.textColor = new THREE.Color(0x5D0359);
      this.hoverTextColor = new THREE.Color(0xFFFF00);
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / window.innerHeight, 0.1, 1000);
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      this.renderer.setClearColor(0xffffff, 0);
      this.renderer.autoClear = false;
      this.container.appendChild(this.renderer.domElement);

      var renderModel = new THREE.RenderPass(this.scene, this.camera);
      var effectBloom = new THREE.BloomPass(1.5, 25, undefined, 512);
      effectBloom.autoclear = false;
      var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
      effectCopy.renderToScreen = true;
      var composer = new THREE.EffectComposer(this.renderer);
      composer.addPass(renderModel);
      composer.addPass(effectBloom);
      composer.addPass(effectCopy);
      effectCopy.clear = true;
      this.composer = composer;

      var skillsIco = new THREE.IcosahedronBufferGeometry(1, 5);

      skillsIco.attributes.position.dynamic = true;
      var colors = [];
      var vertForces = [];
      for (var p = 0; p < skillsIco.attributes.position.count; p++) {
        colors.push(0.0282, 0.3718, 0.6);
        vertForces[p] = [];
      }
      skillsIco.addAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      skillsIco.attributes.color.dynamic = true;

      var nskill = 0;
      var getSkillInfos = function getSkillInfos(name, value) {
        return {
          name: name,
          position: [],
          value: value,
          lines: [],
          text: null,
          verticesInfos: [],
          curIdx: [],
          nextVert: 0,
          startTime: 500 * nskill++,
          hovered: false
        };
      };
      var skills = [getSkillInfos("HTML5", 80), getSkillInfos("CSS3", 80), getSkillInfos("Javascript ES5/ES6", 70), getSkillInfos("UML", 45), getSkillInfos("Java", 65), getSkillInfos("JavaFx", 40), getSkillInfos("C#", 50), getSkillInfos("GLSL", 45), getSkillInfos("git", 65), getSkillInfos("SQL", 45), getSkillInfos("Aurelia", 70)];

      var offset = 2.0 / skills.length;
      var increment = Math.PI * (3 - Math.sqrt(5));
      for (var i = 0; i < skills.length; i++) {
        var y = i * offset - 1 + offset * 0.5;
        var r = Math.sqrt(1 - Math.pow(y, 2));
        var phi = i % skills.length * increment;

        var x = Math.cos(phi) * r;
        var z = Math.sin(phi) * r;
        skills[i].position = [x, y, z];
      }

      var lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, vertexColors: THREE.VertexColors });
      var textMaterial = new THREE.MeshLambertMaterial({ color: 0x5D0359 });

      var rad = 0.6;
      for (var j = 0; j < skills.length; j++) {

        var pos = skillsIco.attributes.position;
        var posVec = new THREE.Vector3(skills[j].position[0], skills[j].position[1], skills[j].position[2]);

        skills[j].vertices = [];
        skills[j].rad = rad;

        for (var _p = 0; _p < pos.count; _p++) {
          var vertx = pos.getX(_p);
          var verty = pos.getY(_p);
          var vertz = pos.getZ(_p);

          var distSq = posVec.distanceToSquared(new THREE.Vector3(vertx, verty, vertz));
          if (distSq < rad * rad) {
            if (vertx == 0) vertx = 0.00001;
            var theta = Math.acos(vertz);
            var phi = Math.atan(verty / vertx);
            var skillVal = skills[j].value / 100;
            var normDist = 1 - distSq / (rad * rad);
            skills[j].verticesInfos.push({
              id: _p,
              dist: normDist,
              timeStarted: null
            });

            var newRad = this.lerp(1, 1 + skillVal, normDist * normDist * normDist * normDist * normDist * normDist * normDist);

            if (vertx < 0) {
              theta = Math.PI * 2 - theta;
            }
            vertForces[_p].push({
              pos: new THREE.Vector3(newRad * Math.sin(theta) * Math.cos(phi), newRad * Math.sin(theta) * Math.sin(phi), newRad * Math.cos(theta)),
              power: skillVal,
              dist: normDist
            });
          }
        }
        skills[j].verticesInfos.sort(function (a, b) {
          return a.dist - b.dist;
        });

        var center = skills[j].position;
        var length = 2 + 0.5 * Math.random();
        var end = new THREE.Vector3(length * center[0], length * center[1], length * center[2]);

        for (var l = 0; l < 4; l++) {
          var lineGeom = new THREE.BufferGeometry();
          lineGeom.addAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, end.x, end.y, end.z], 3));
          lineGeom.addAttribute('color', new THREE.Float32BufferAttribute([1, 0, 0, 1, 0, 0], 3));
          lineGeom.attributes.position.dynamic = true;
          var line = new THREE.Line(lineGeom, lineMaterial);
          skills[j].lines.push(line);
          this.scene.add(line);
        }

        var textGeometry = new THREE.TextBufferGeometry(skills[j].name, { font: this.font });
        var sc = 0.0015;
        textGeometry.scale(sc, sc, sc / 10);
        textGeometry.computeBoundingBox();
        var text = new THREE.Mesh(textGeometry, new THREE.MeshLambertMaterial({ color: this.textColor.clone() }));
        textGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(-text.geometry.boundingBox.getSize(new THREE.Vector3()).x * 0.5, 0, 0));
        text.position.set(end.x, end.y, end.z);
        var bb = textGeometry.boundingBox;
        var bbg = new THREE.BoxGeometry(bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z);
        var bbm = new THREE.Mesh(bbg, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
        bbm.position.y = 0.06;
        text.add(bbm);
        this.scene.add(text);

        skills[j].text = text;
      }

      this.desiredPos = [];
      for (var _p2 = 0; _p2 < pos.count; _p2++) {
        var sum = new THREE.Vector3();
        if (vertForces[_p2].length == 0) {
          sum.set(pos.getX(_p2), pos.getY(_p2), pos.getZ(_p2));
        } else if (vertForces[_p2].length == 2) {
          var p1 = vertForces[_p2][0].pos;
          var p2 = vertForces[_p2][1].pos;
          sum = sum.add(p1);
          sum = sum.add(p2);
          sum = sum.divideScalar(2);
        } else {
          sum = vertForces[_p2][0].pos;
        }
        this.desiredPos[_p2] = sum;
      }
      skillsIco.attributes.position.needsUpdate = true;
      skillsIco.attributes.color.needsUpdate = true;

      this.skillsOriginalPos = skillsIco.attributes.position.clone();

      this.discSprite.premultiplyAlpha = true;
      var material = new THREE.PointsMaterial({ map: this.discSprite, vertexColors: THREE.VertexColors, size: 0.04, opacity: 1.0, transparent: true });
      material.alphaTest = 0.2;
      this.skillsIcoMesh = new THREE.Points(skillsIco, material);

      this.light = new THREE.PointLight(0xffffff, 1);
      this.ambientLight = new THREE.AmbientLight(0xffffff, .8);

      var controls = new THREE.TrackballControls(this.camera, this.container);
      controls.rotateSpeed = 3.0;
      controls.zoomSpeed = 1.2;
      controls.noZoom = false;
      controls.noPan = true;
      controls.staticMoving = false;
      controls.dynamicDampingFactor = 0.09;
      controls.keys = [65, 83, 68];

      this.controls = controls;
      this.skills = skills;

      this.controls.addEventListener('change', function () {
        this.light.position.copy(this.camera.position);
      }.bind(this));

      this.scene.add(this.ambientLight);
      this.scene.add(this.light);
      this.scene.add(this.skillsIcoMesh);

      var greySphere = new THREE.SphereGeometry(0.98, 64, 64);
      var mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.008, 0.008, 0.008) });
      this.scene.add(new THREE.Mesh(greySphere, mat));

      var outerSphere = new THREE.SphereGeometry(150, 64, 64);
      var r = 0.401833255;
      var mat2 = new THREE.MeshBasicMaterial({ color: new THREE.Color(r * 0.2627450980392157, r * 0.25882352941176473, r * 0.2627450980392157), side: THREE.DoubleSide });
      this.scene.add(new THREE.Mesh(outerSphere, mat2));

      this.raycaster = new THREE.Raycaster();


      this.camera.position.z = 4;
      this.timeStarted = Date.now();
      this.lastUpdate = Date.now();
      this.mouse = { x: 0, y: 0 };
      this.renderer.domElement.addEventListener('mousemove', this.onmousemove.bind(this), false);
      this.renderer.domElement.addEventListener('mouseup', this.onmouseclick.bind(this), false);
      this.inited = true;
      this.update();
    };

    ScreenSkills.prototype.onmouseclick = function onmouseclick(event) {
      event.preventDefault();
      this.mouseJustPressed = true;
    };

    ScreenSkills.prototype.onmousemove = function onmousemove(event) {
      event.preventDefault();
      this.mouse.x = (event.clientX - 8) / this.renderer.domElement.clientWidth * 2 - 1;
      this.mouse.y = -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
    };

    ScreenSkills.prototype.update = function update() {
      var _this2 = this;

      if (!this.paused) {
        var now = Date.now();
        this.dt = now - this.lastUpdate;
        this.lastUpdate = now;
        this.totalTime += this.dt;

        this.controls.update();

        for (var _iterator = this.skills, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
          var _ref;

          if (_isArray) {
            if (_i >= _iterator.length) break;
            _ref = _iterator[_i++];
          } else {
            _i = _iterator.next();
            if (_i.done) break;
            _ref = _i.value;
          }

          var skill = _ref;

          var lastVertice = skill.verticesInfos[skill.verticesInfos.length - 1];
          if (this.totalTime < skill.startTime || lastVertice.timeStarted != null && this.totalTime - lastVertice.timeStarted > 2000) continue;
          var j = 0;
          while (skill.nextVert < skill.verticesInfos.length && j++ < 15) {
            skill.verticesInfos[skill.nextVert++].timeStarted = this.totalTime;
          }
          for (var i = this.startAt; i < skill.nextVert; i++) {
            var vert = skill.verticesInfos[i];
            var vertId = vert.id;

            var posCoef = (this.totalTime - vert.timeStarted) / 750;
            posCoef = 3 * posCoef * (1 - posCoef) * (1 - posCoef);
            if (posCoef > 1) posCoef = 1;
            this.skillsIcoMesh.geometry.attributes.position.setX(vertId, this.lerp(this.skillsOriginalPos.getX(vertId), this.desiredPos[vertId].x, posCoef));
            this.skillsIcoMesh.geometry.attributes.position.setY(vertId, this.lerp(this.skillsOriginalPos.getY(vertId), this.desiredPos[vertId].y, posCoef));
            this.skillsIcoMesh.geometry.attributes.position.setZ(vertId, this.lerp(this.skillsOriginalPos.getZ(vertId), this.desiredPos[vertId].z, posCoef));

            var colCoef = (this.totalTime - vert.timeStarted) / 2000;
            if (colCoef > 1) colCoef = 1;
            colCoef = 6.7 * colCoef * (1 - colCoef) * (1 - colCoef);
            this.skillsIcoMesh.geometry.attributes.color.setX(vertId, this.lerp(0.0282, 1, colCoef));
            this.skillsIcoMesh.geometry.attributes.color.setY(vertId, this.lerp(0.3718, 1, colCoef));
            this.skillsIcoMesh.geometry.attributes.color.setZ(vertId, this.lerp(0.6, 1, colCoef));
            if (colCoef >= 1) this.startAt = i;
          }
        }

        for (var _iterator2 = this.skills, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
          var _ref2;

          if (_isArray2) {
            if (_i2 >= _iterator2.length) break;
            _ref2 = _iterator2[_i2++];
          } else {
            _i2 = _iterator2.next();
            if (_i2.done) break;
            _ref2 = _i2.value;
          }

          var sk = _ref2;

          sk.text.quaternion.copy(this.camera.quaternion);
        }

        var bounce = function (skill) {
          var _this = this;

          var loop = true;
          var i = skill.verticesInfos.length;
          var range = 25;

          var _loop = function _loop() {
            if (i < 0) return 'break';
            var end = i;
            var start = Math.max(0, i - range);
            _this.lerpService.addEasing(function (t) {
              t = 7 * t * (1 - t) * (1 - t);
              if (t > 1) t = 1;
              for (var j = start; j < end; j++) {
                var vert = skill.verticesInfos[j];
                var vertId = vert.id;
                this.skillsIcoMesh.geometry.attributes.position.setX(vertId, this.lerp(this.skillsOriginalPos.getX(vertId), this.desiredPos[vertId].x, 1 - t));
                this.skillsIcoMesh.geometry.attributes.position.setY(vertId, this.lerp(this.skillsOriginalPos.getY(vertId), this.desiredPos[vertId].y, 1 - t));
                this.skillsIcoMesh.geometry.attributes.position.setZ(vertId, this.lerp(this.skillsOriginalPos.getZ(vertId), this.desiredPos[vertId].z, 1 - t));

                this.skillsIcoMesh.geometry.attributes.color.setX(vertId, this.lerp(0.0282, 1, t));
                this.skillsIcoMesh.geometry.attributes.color.setY(vertId, this.lerp(0.3718, 1, t));
                this.skillsIcoMesh.geometry.attributes.color.setZ(vertId, this.lerp(0.6, 1, t));
              }
            }, 1000, _this, ~~((skill.verticesInfos.length - end) / range) * 10);
            i -= range;
          };

          while (loop) {
            var _ret = _loop();

            if (_ret === 'break') break;
          }
        }.bind(this);

        this.raycaster.setFromCamera(this.mouse, this.camera);

        var _loop2 = function _loop2() {
          if (_isArray3) {
            if (_i3 >= _iterator3.length) return 'break';
            _ref3 = _iterator3[_i3++];
          } else {
            _i3 = _iterator3.next();
            if (_i3.done) return 'break';
            _ref3 = _i3.value;
          }

          var skill = _ref3;

          var isect = _this2.raycaster.intersectObject(skill.text, true);
          if (isect != null && isect.length > 0 && _this2.totalTime > 1000) {
            if (!skill.hovered) {
              skill.hovered = true;
              _this2.lerpService.addEasing(function (t) {
                t = 1 - (1 - t) * (1 - t) * (1 - t);
                skill.text.material.color.r = this.lerp(this.textColor.r, this.hoverTextColor.r, t);
                skill.text.material.color.g = this.lerp(this.textColor.g, this.hoverTextColor.g, t);
                skill.text.material.color.b = this.lerp(this.textColor.b, this.hoverTextColor.b, t);
              }, 500, _this2);
              bounce(skill);
            }
            if (_this2.mouseJustPressed) {
              bounce(skill);
            }
          } else {
            if (skill.hovered) {
              skill.hovered = false;
              _this2.lerpService.addEasing(function (t) {
                t = t * t * t;
                skill.text.material.color.r = this.lerp(this.hoverTextColor.r, this.textColor.r, t);
                skill.text.material.color.g = this.lerp(this.hoverTextColor.g, this.textColor.g, t);
                skill.text.material.color.b = this.lerp(this.hoverTextColor.b, this.textColor.b, t);
              }, 500, _this2);
            }
          }
          _this2.skillsIcoMesh.geometry.attributes.position.needsUpdate = true;
          _this2.skillsIcoMesh.geometry.attributes.color.needsUpdate = true;
        };

        for (var _iterator3 = this.skills, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
          var _ref3;

          var _ret2 = _loop2();

          if (_ret2 === 'break') break;
        }

        this.mouseJustPressed = false;


        this.composer.render(0.01);
      }
      requestAnimationFrame(this.update.bind(this));
    };

    ScreenSkills.prototype.lerp = function lerp(a, b, position) {
      return (1.0 - position) * a + position * b;
    };

    return ScreenSkills;
  }()) || _class);
});
define('services/lerp-service',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var instance = null;

  var LerpService = exports.LerpService = function () {
    function LerpService() {
      _classCallCheck(this, LerpService);

      this.idCounter = 0;
      this.easingInfos = [];
      this.toRemove = [];

      if (instance == null) {
        instance = this;
        this.processEasings();
      }
      return instance;
    }

    LerpService.prototype.addEasing = function addEasing(func, duration, scope) {
      var delay = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var onFinish = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;

      var infos = {
        func: func.bind(scope),
        started: 0,
        duration: duration,
        onFinish: onFinish,
        canceled: false
      };
      setTimeout(function () {
        infos.started = Date.now();
        this.easingInfos.push(infos);
      }.bind(this), delay);
      return function () {
        var index = this.easingInfos.indexOf(infos);
        infos.canceled = true;
        if (index > -1) this.toRemove.push(infos);
      }.bind(this);
    };

    LerpService.prototype.processEasings = function processEasings() {
      var now = Date.now();
      for (var _iterator = this.easingInfos, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var ease = _ref;

        var t = (now - ease.started) / ease.duration;
        if (t < 1) {
          if (!ease.canceled) ease.func(t);
        } else {
          if (!ease.canceled) ease.func(1);
          this.toRemove.push(ease);
          if (ease.onFinish != null) ease.onFinish();
        }
      }
      for (var _iterator2 = this.toRemove, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
        var _ref2;

        if (_isArray2) {
          if (_i2 >= _iterator2.length) break;
          _ref2 = _iterator2[_i2++];
        } else {
          _i2 = _iterator2.next();
          if (_i2.done) break;
          _ref2 = _i2.value;
        }

        var rem = _ref2;

        this.easingInfos.splice(this.easingInfos.indexOf(rem), 1);
      }
      this.toRemove = [];
      requestAnimationFrame(this.processEasings.bind(this));
    };

    LerpService.prototype.lerp = function lerp(a, b, position) {
      return (1.0 - position) * a + position * b;
    };

    return LerpService;
  }();
});
define('resources/attributes/polygon-transition',['exports', 'aurelia-framework', '../../services/lerp-service'], function (exports, _aureliaFramework, _lerpService) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.PolygonTransition = undefined;

  function _initDefineProp(target, property, descriptor, context) {
    if (!descriptor) return;
    Object.defineProperty(target, property, {
      enumerable: descriptor.enumerable,
      configurable: descriptor.configurable,
      writable: descriptor.writable,
      value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
    });
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
    var desc = {};
    Object['ke' + 'ys'](descriptor).forEach(function (key) {
      desc[key] = descriptor[key];
    });
    desc.enumerable = !!desc.enumerable;
    desc.configurable = !!desc.configurable;

    if ('value' in desc || desc.initializer) {
      desc.writable = true;
    }

    desc = decorators.slice().reverse().reduce(function (desc, decorator) {
      return decorator(target, property, desc) || desc;
    }, desc);

    if (context && desc.initializer !== void 0) {
      desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
      desc.initializer = undefined;
    }

    if (desc.initializer === void 0) {
      Object['define' + 'Property'](target, property, desc);
      desc = null;
    }

    return desc;
  }

  function _initializerWarningHelper(descriptor, context) {
    throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
  }

  var _dec, _dec2, _class, _desc, _value, _class2, _descriptor, _descriptor2;

  var PolygonTransition = exports.PolygonTransition = (_dec = (0, _aureliaFramework.customAttribute)('polygon-transition'), _dec2 = (0, _aureliaFramework.inject)(_aureliaFramework.DOM.Element, _lerpService.LerpService), _dec(_class = _dec2(_class = (_class2 = function () {
    function PolygonTransition(element, lerp) {
      _classCallCheck(this, PolygonTransition);

      _initDefineProp(this, 'direction', _descriptor, this);

      _initDefineProp(this, 'orientation', _descriptor2, this);

      this.rotX = 0;
      this.rotY = 0;
      this.rotZ = 0;
      this.resizeID = null;
      this.resizeID2 = null;

      this.lerpService = lerp;
      this.element = element;
      this.element.position = "relative";
      window.addEventListener('resize', this.onresize.bind(this));
    }

    PolygonTransition.prototype.attached = function attached() {

      this.faces = [];
      var faceCount = this.element.children.length;
      this.faceCount = faceCount;

      var wrapper = document.createElement('div');
      this.element.appendChild(wrapper);
      for (var i = 0; i < this.faceCount; i++) {
        var c = this.element.children[0];
        this.faces.push(c);
        wrapper.appendChild(c);
      }
      this.element.style.perspective = "500px";
      var w = this.element.clientWidth;
      var h = this.element.clientHeight;
      wrapper.style.width = w + "px";
      wrapper.style.height = h + "px";
      this.wrapper = wrapper;

      this.wrapper.style.transformStyle = "preserve-3d";
      this.wrapper.style.transition = "transform 0.35s ease-out";

      this.initialize();

      window.addEventListener("keydown", function (ev) {
        switch (ev.key) {
          case 'ArrowRight':
            this.next();
            break;
          case 'ArrowLeft':
            this.previous();
            break;
        }
      }.bind(this));
    };

    PolygonTransition.prototype.next = function next() {
      if (this.orientation == "vertical") {
        this.rotX += this.angle;
      } else {
        this.rotY += this.angle;
      }
      this.wrapper.style.transform = "translateZ(" + (-40 + this.distZ * -1) + "px)rotateX(" + this.rotX + "deg)rotateY(" + this.rotY + "deg)rotateZ(" + this.rotZ + "deg)";
      setTimeout(function () {
        this.wrapper.style.transform = "translateZ(" + this.distZ * -1 + "px)rotateX(" + this.rotX + "deg)rotateY(" + this.rotY + "deg)rotateZ(" + this.rotZ + "deg)";
      }.bind(this), 200);
    };

    PolygonTransition.prototype.previous = function previous() {
      if (this.orientation == "vertical") {
        this.rotX -= this.angle;
      } else {
        this.rotY -= this.angle;
      }
      this.wrapper.style.transform = "translateZ(" + (-40 + this.distZ * -1) + "px)rotateX(" + this.rotX + "deg)rotateY(" + this.rotY + "deg)rotateZ(" + this.rotZ + "deg)";
      setTimeout(function () {
        this.wrapper.style.transform = "translateZ(" + this.distZ * -1 + "px)rotateX(" + this.rotX + "deg)rotateY(" + this.rotY + "deg)rotateZ(" + this.rotZ + "deg)";
      }.bind(this), 200);
    };

    PolygonTransition.prototype.onresize = function onresize() {
      clearTimeout(this.resizeID);
      this.resizeID = setTimeout(this.initialize.bind(this), 50);
      clearTimeout(this.resizeID2);
      this.resizeID2 = setTimeout(this.initialize.bind(this), 70);
    };

    PolygonTransition.prototype.initialize = function initialize() {
      var dir = parseInt(this.direction);
      var angle = dir * 360 / this.faceCount;
      var size = this.orientation == "vertical" ? this.faces[0].clientHeight : this.faces[0].clientWidth;
      var distZ = size / 2 / Math.tan(Math.PI / this.faceCount);
      this.distZ = distZ;
      this.angle = angle;

      var w = this.element.clientWidth;
      var h = this.element.clientHeight;
      this.wrapper.style.transition = "all 0.1s linear";
      this.wrapper.style.width = w + "px";
      this.wrapper.style.height = h + "px";

      for (var i = 0; i < this.faceCount; i++) {
        var face = this.faces[i];
        var rot = -this.angle * i;
        face.style.position = "absolute";
        face.style.transform = (this.orientation == 'vertical' ? 'rotateX(' : 'rotateY(') + rot + "deg)" + " translateZ(" + this.distZ + "px)";
      }
      this.wrapper.style.transform = "translateZ(" + this.distZ * -1 + "px)rotateX(" + this.rotX + "deg)rotateY(" + this.rotY + "deg)rotateZ(" + this.rotZ + "deg)";
      this.wrapper.style.transition = "transform 0.35s ease-out";
    };

    return PolygonTransition;
  }(), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'direction', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: function initializer() {
      return 1;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, 'orientation', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: function initializer() {
      return 'vertical';
    }
  })), _class2)) || _class) || _class);
});
define('resources/attributes/scroll-next',['exports', 'aurelia-framework', '../../services/lerp-service'], function (exports, _aureliaFramework, _lerpService) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.ScrollNext = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _dec2, _class;

  var ScrollNext = exports.ScrollNext = (_dec = (0, _aureliaFramework.customAttribute)('scroll-next'), _dec2 = (0, _aureliaFramework.inject)(_aureliaFramework.DOM.Element, _lerpService.LerpService), _dec(_class = _dec2(_class = function () {
    function ScrollNext(element, lerp) {
      _classCallCheck(this, ScrollNext);

      this.lerpService = lerp;
      this.element = element;
    }

    ScrollNext.prototype.attached = function attached() {

      var nextBtn = document.createElement('div');
      nextBtn.classList.add('btn');
      nextBtn.classList.add('btn-hidden');
      nextBtn.classList.add('btn-next');
      this.nextBtn = nextBtn;
      this.element.appendChild(nextBtn);

      setTimeout(function () {
        this.nextBtn.classList.remove('btn-hidden');
      }.bind(this), 2000);

      this.nextBtn.onclick = this.toNext.bind(this);
    };

    ScrollNext.prototype.toNext = function toNext() {
      var y = (window.pageYOffset || document.scrollTop) - (document.clientTop || 0) || 0;
      this.lerpService.addEasing(function (t) {
        window.scrollTo(0, this.lerpService.lerp(y, window.innerHeight * this.index, 1 - (1 - t) * (1 - t) * (1 - t)));
      }, 1000, this);
    };

    ScrollNext.prototype.valueChanged = function valueChanged(newValue, oldValue) {
      this.index = parseInt(newValue);
    };

    return ScrollNext;
  }()) || _class) || _class);
});
define('resources/attributes/scroll-target',['exports', 'aurelia-framework', '../../services/lerp-service'], function (exports, _aureliaFramework, _lerpService) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.ScrollTarget = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _dec2, _class;

  var ScrollTarget = exports.ScrollTarget = (_dec = (0, _aureliaFramework.customAttribute)('scroll-target'), _dec2 = (0, _aureliaFramework.inject)(_aureliaFramework.DOM.Element, _lerpService.LerpService), _dec(_class = _dec2(_class = function () {
    function ScrollTarget(element, lerp) {
      _classCallCheck(this, ScrollTarget);

      this.index = 0;

      this.lerpService = lerp;
      this.element = element;
      this.smoothScrollId = null;
      var cancelNext = false;
      var lastY = 0;
      window.addEventListener('scroll', function (event) {
        var y = (window.pageYOffset || document.scrollTop) - (document.clientTop || 0) || 0;
        var dir = y - lastY;
        if (cancelNext) {
          clearTimeout(this.smoothScrollId);
          event.preventDefault = true;
          return;
        }
        lastY = y;
        clearTimeout(this.smoothScrollId);
        this.smoothScrollId = setTimeout(function () {
          var ratio = 1 + y / window.innerHeight;
          if (Math.abs(dir) < 15 && dir > 0 && ratio > this.index && ratio < this.index + 1 || Math.abs(dir) < 15 && dir < 0 && ratio > this.index && ratio < this.index + 1) {
            var indexTweak = dir < 0 ? -1 : 0;
            cancelNext = true;
            this.lerpService.addEasing(function (t) {
              window.scrollTo(0, this.lerpService.lerp(y, window.innerHeight * (this.index + indexTweak), 1 - (1 - t) * (1 - t) * (1 - t)));
              cancelNext = true;
            }, 1000, this, null, function () {
              clearTimeout(this.smoothScrollId);
              this.smoothScrollId = null;
              cancelNext = true;
              setTimeout(function () {
                return cancelNext = false;
              }, 20);
            });
          }
        }.bind(this), 50);
      }.bind(this));
    }

    ScrollTarget.prototype.valueChanged = function valueChanged(newValue, oldValue) {
      this.index = parseInt(newValue);
    };

    return ScrollTarget;
  }()) || _class) || _class);
});
define('resources/attributes/scroll-transform',['exports', 'aurelia-framework', '../../services/lerp-service'], function (exports, _aureliaFramework, _lerpService) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.ScrollTransform = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _dec2, _class;

  var ScrollTransform = exports.ScrollTransform = (_dec = (0, _aureliaFramework.customAttribute)('scroll-transform'), _dec2 = (0, _aureliaFramework.inject)(_aureliaFramework.DOM.Element, _lerpService.LerpService), _dec(_class = _dec2(_class = function () {
    function ScrollTransform(element, lerp) {
      _classCallCheck(this, ScrollTransform);

      this.index = 0;

      this.lerpService = lerp;
      this.element = element;
      window.addEventListener('scroll', function (event) {
        var y = (window.pageYOffset || document.scrollTop) - (document.clientTop || 0) || 0;
        var ratio = 1 + y / window.innerHeight - this.index;
        var rotateAmount = 180;
        var from = 0;
        var to = 90;
        if (ratio >= 0 && ratio < 1) {
          element.style.transformOrigin = "center bottom 0px";
          from = 0;
          to = 90;
        } else if (ratio > -1 && ratio < 0) {
          element.style.transformOrigin = "center top 0px";
          from = -90;
          to = 0;
          ratio = 1 - ratio * -1;
        }
        if (ratio > 1) ratio = 1;
        if (ratio < 0) ratio = 0;

        rotateAmount = this.lerpService.lerp(from, to, ratio);
        this.element.style.transform = "perspective(675px)rotateX(" + rotateAmount + "deg)";
      }.bind(this));
    }

    ScrollTransform.prototype.valueChanged = function valueChanged(newValue, oldValue) {
      this.index = parseInt(newValue);
    };

    return ScrollTransform;
  }()) || _class) || _class);
});
define('resources/elements/console-section',["exports", "aurelia-framework", "aurelia-event-aggregator"], function (exports, _aureliaFramework, _aureliaEventAggregator) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.ConsoleSection = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var ConsoleSection = exports.ConsoleSection = (_dec = (0, _aureliaFramework.inject)(_aureliaEventAggregator.EventAggregator), _dec(_class = function () {
    function ConsoleSection(ea) {
      _classCallCheck(this, ConsoleSection);

      this.state = 0;
      this.lines = ["Bonjour,", "Je m'appelle Mathieu Emilian", "Je suis développeur", "J'aime travailler sur des projets créatifs", " "];
      this.typingSpeed = 35;
      this.linePauseDuration = 700;
      this.currentLineIdx = 0;
      this.currentCharIdx = 0;
      this.linesElements = [];
      this.canStart = false;
      this.currentWordIdx = 0;
      this.pauseTimer = 0;
      this.parentOverride = null;

      this.ea = ea;
    }

    ConsoleSection.prototype.attached = function attached() {
      this.linesElements = this._console.getElementsByClassName('line');
      this.typingInterval = setInterval(this.type.bind(this), this.typingSpeed);
      this.carret.parentElement.removeChild(this.carret);
      this.linesElements[0].appendChild(this.carret);
      this.ea.subscribe('app-ready', function () {
        window.setTimeout(function () {
          this.canStart = true;
        }.bind(this), 800);
      }.bind(this));
    };

    ConsoleSection.prototype.createCharSpan = function createCharSpan(char) {
      var span = document.createElement("span");
      if (char != " ") span.classList.add('console-letter');
      span.textContent = char;

      return span;
    };

    ConsoleSection.prototype.startWordSwitch = function startWordSwitch() {
      this.words = [];
      var oldWord = document.getElementsByClassName('strong-word')[2];
      while (oldWord.childElementCount > 0) {
        oldWord.firstChild.remove();
      }var i = 0;
      var _arr = ["créatifs   ", "interactifs", "innovants  "];
      for (var _i = 0; _i < _arr.length; _i++) {
        var word = _arr[_i];
        var wordElement = document.createElement('span');
        wordElement.classList.add('word-switch');
        for (var _iterator = word, _isArray = Array.isArray(_iterator), _i2 = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
          var _ref;

          if (_isArray) {
            if (_i2 >= _iterator.length) break;
            _ref = _iterator[_i2++];
          } else {
            _i2 = _iterator.next();
            if (_i2.done) break;
            _ref = _i2.value;
          }

          var char = _ref;

          var span = this.createCharSpan(char);
          wordElement.appendChild(span);
          span.style.transform = i == 0 ? "rotateX(0deg)" : i == 1 ? "rotateX(90deg)" : "rotateX(-90deg)";
        }
        oldWord.appendChild(wordElement);
        this.words.push(wordElement);
        i++;
      }
      this.wordSwitchInterval = setInterval(this.wordSwitch.bind(this), 1500);
      this.wordSwitch();
    };

    ConsoleSection.prototype.wordSwitch = function wordSwitch() {
      var nextWordIdx = (this.currentWordIdx + 1) % 3;
      var i = 0;

      var _loop = function _loop() {
        if (_isArray2) {
          if (_i3 >= _iterator2.length) return "break";
          _ref2 = _iterator2[_i3++];
        } else {
          _i3 = _iterator2.next();
          if (_i3.done) return "break";
          _ref2 = _i3.value;
        }

        var child = _ref2;

        child.style.transformOrigin = 'bottom';
        setTimeout(function () {
          return child.style.transform = 'rotateX(-90deg)';
        }, i++ * 60);
      };

      for (var _iterator2 = this.words[this.currentWordIdx].children, _isArray2 = Array.isArray(_iterator2), _i3 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
        var _ref2;

        var _ret = _loop();

        if (_ret === "break") break;
      }
      i = 0;

      var _loop2 = function _loop2() {
        if (_isArray3) {
          if (_i4 >= _iterator3.length) return "break";
          _ref3 = _iterator3[_i4++];
        } else {
          _i4 = _iterator3.next();
          if (_i4.done) return "break";
          _ref3 = _i4.value;
        }

        var child = _ref3;

        child.style.transformOrigin = 'top';
        setTimeout(function () {
          return child.style.transform = 'rotateX(0deg)';
        }, i++ * 60);
      };

      for (var _iterator3 = this.words[nextWordIdx].children, _isArray3 = Array.isArray(_iterator3), _i4 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
        var _ref3;

        var _ret2 = _loop2();

        if (_ret2 === "break") break;
      }
      this.currentWordIdx = nextWordIdx;
    };

    ConsoleSection.prototype.type = function type() {
      if (this.paused && Date.now() - this.pausedTime > this.linePauseDuration) {
        this.paused = false;
      }

      if (!this.canStart || this.paused) return;

      if (this.currentLineIdx >= this.lines.length) {
        this.paused = true;
        clearInterval(this.typingInterval);
        this.blink();
        this.carretInterval = setInterval(this.blink.bind(this), 1200);
        this.startWordSwitch();
        var letters = document.getElementsByClassName("console-letter");

        var _loop3 = function _loop3() {
          if (_isArray4) {
            if (_i5 >= _iterator4.length) return "break";
            _ref4 = _iterator4[_i5++];
          } else {
            _i5 = _iterator4.next();
            if (_i5.done) return "break";
            _ref4 = _i5.value;
          }

          var letter = _ref4;

          if (letter.parentElement.classList.contains('word-switch')) return "continue";
          letter.addEventListener('mouseover', function (ev) {
            var dx = Math.floor(Math.random() * 100 - 50);
            var dy = Math.floor(Math.random() * 100 - 50);
            letter.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
            setTimeout(function () {
              letter.style.transform = 'translate(0,0)';
            }, 1200);
          });
        };

        _loop4: for (var _iterator4 = letters, _isArray4 = Array.isArray(_iterator4), _i5 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
          var _ref4;

          var _ret3 = _loop3();

          switch (_ret3) {
            case "break":
              break _loop4;

            case "continue":
              continue;}
        }

        this.ea.publish('typing-finished');
        return;
      }

      if (this.currentCharIdx >= this.lines[this.currentLineIdx].length) {
        this.currentLineIdx++;
        this.currentCharIdx = 0;
        this.paused = true;
        this.pausedTime = Date.now();
        this.parentOverride = null;
        return;
      }

      var line = this.lines[this.currentLineIdx];
      var parent = this.linesElements[this.currentLineIdx];
      if (this.currentLineIdx === 1 && line.substring(this.currentCharIdx) == "Mathieu Emilian" || this.currentLineIdx === 2 && line.substring(this.currentCharIdx) == "développeur" || this.currentLineIdx === 3 && line.substring(this.currentCharIdx) == "créatifs") {
        var highlightContainer = document.createElement('span');
        highlightContainer.classList.add('strong-word');
        parent.appendChild(highlightContainer);
        this.parentOverride = highlightContainer;
      }
      if (this.parentOverride != null) parent = this.parentOverride;
      var char = line.charAt(this.currentCharIdx);
      var span = this.createCharSpan(char);
      parent.appendChild(span);

      this.carret.parentElement.removeChild(this.carret);
      this.linesElements[this.currentLineIdx].appendChild(this.carret);
      this.currentCharIdx++;
    };

    ConsoleSection.prototype.blink = function blink() {
      if (!this.paused) {
        this.carret.style.opacity = 1;
        return;
      }
      this.carret.style.opacity = 0;
      setTimeout(function () {
        this.carret.style.opacity = 1;
      }.bind(this), 600);
    };

    return ConsoleSection;
  }()) || _class);
});
define('resources/elements/menu-bar',['exports', 'aurelia-framework', '../../services/lerp-service'], function (exports, _aureliaFramework, _lerpService) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.MenuBar = undefined;

  function _initDefineProp(target, property, descriptor, context) {
    if (!descriptor) return;
    Object.defineProperty(target, property, {
      enumerable: descriptor.enumerable,
      configurable: descriptor.configurable,
      writable: descriptor.writable,
      value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
    });
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
    var desc = {};
    Object['ke' + 'ys'](descriptor).forEach(function (key) {
      desc[key] = descriptor[key];
    });
    desc.enumerable = !!desc.enumerable;
    desc.configurable = !!desc.configurable;

    if ('value' in desc || desc.initializer) {
      desc.writable = true;
    }

    desc = decorators.slice().reverse().reduce(function (desc, decorator) {
      return decorator(target, property, desc) || desc;
    }, desc);

    if (context && desc.initializer !== void 0) {
      desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
      desc.initializer = undefined;
    }

    if (desc.initializer === void 0) {
      Object['define' + 'Property'](target, property, desc);
      desc = null;
    }

    return desc;
  }

  function _initializerWarningHelper(descriptor, context) {
    throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
  }

  var _dec, _dec2, _class, _desc, _value, _class2, _descriptor;

  var MenuBar = exports.MenuBar = (_dec = (0, _aureliaFramework.inject)(_lerpService.LerpService), _dec2 = (0, _aureliaFramework.customElement)('menu-bar'), _dec(_class = _dec2(_class = (_class2 = function () {
    function MenuBar(ls) {
      _classCallCheck(this, MenuBar);

      _initDefineProp(this, 'titles', _descriptor, this);

      this.mouseY = 0;
      this.wasMouseInRange = false;

      this.lerpService = ls;
    }

    MenuBar.prototype.attached = function attached() {
      window.addEventListener('mousemove', function (event) {
        this.mouseY = event.clientY;

        if (this.mouseY < 35) {
          this.wasMouseInRange = true;
          this.menu.style.height = "21px";
        } else if (this.wasMouseInRange) {
          this.wasMouseInRange = false;
          this.menu.style.height = 0;
        }
      }.bind(this));
      window.addEventListener('scroll', this.updateProgress.bind(this));
      this.updateProgress();
      this.current.style.width = 100 / this.titles.length + "%";
    };

    MenuBar.prototype.updateProgress = function updateProgress() {
      var y = (window.pageYOffset || document.scrollTop) - (document.clientTop || 0) || 0;
      var h = document.body.scrollHeight;
      this.foreground.style.width = y * 100 / h + "%";
    };

    MenuBar.prototype.goToScreen = function goToScreen(index) {
      var y = (window.pageYOffset || document.scrollTop) - (document.clientTop || 0) || 0;
      this.lerpService.addEasing(function (t) {
        window.scrollTo(0, this.lerpService.lerp(y, window.innerHeight * (index - 1), 1 - (1 - t) * (1 - t) * (1 - t)));
      }, 1000, this);
    };

    return MenuBar;
  }(), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'titles', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: null
  })), _class2)) || _class) || _class);
});
define('resources/elements/project-showcase',['exports', 'aurelia-framework', 'aurelia-event-aggregator', '../../services/lerp-service'], function (exports, _aureliaFramework, _aureliaEventAggregator, _lerpService) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.ProjectShowcase = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var ProjectShowcase = exports.ProjectShowcase = (_dec = (0, _aureliaFramework.inject)(_aureliaEventAggregator.EventAggregator, _lerpService.LerpService), _dec(_class = function () {
    function ProjectShowcase(ea, ls) {
      _classCallCheck(this, ProjectShowcase);

      this.lerpService = ls;
      this.ea = ea;
      this.ea.subscribe('update-project-transform', this.updateTransform.bind(this));
    }

    ProjectShowcase.prototype.activate = function activate(data) {
      this.data = data;
    };

    ProjectShowcase.prototype.attached = function attached() {
      this.updateTransform({ direction: 'prev',
        prevActive: this.data.parent.prevActiveIndex,
        active: this.data.parent.activeIndex,
        previous: this.data.parent.previousIndex,
        next: this.data.parent.nextIndex
      });
    };

    return ProjectShowcase;
  }()) || _class);
});
define('threefix/postprocessing/BloomPass',["three", "threefix/postprocessing/EffectComposer"], function (_three, _EffectComposer) {
	"use strict";

	var THREE = _interopRequireWildcard(_three);

	function _interopRequireWildcard(obj) {
		if (obj && obj.__esModule) {
			return obj;
		} else {
			var newObj = {};

			if (obj != null) {
				for (var key in obj) {
					if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
				}
			}

			newObj.default = obj;
			return newObj;
		}
	}

	THREE.BloomPass = function (strength, kernelSize, sigma, resolution) {

		THREE.Pass.call(this);

		strength = strength !== undefined ? strength : 1;
		kernelSize = kernelSize !== undefined ? kernelSize : 25;
		sigma = sigma !== undefined ? sigma : 4.0;
		resolution = resolution !== undefined ? resolution : 256;

		var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };

		this.renderTargetX = new THREE.WebGLRenderTarget(resolution, resolution, pars);
		this.renderTargetX.texture.name = "BloomPass.x";
		this.renderTargetY = new THREE.WebGLRenderTarget(resolution, resolution, pars);
		this.renderTargetY.texture.name = "BloomPass.y";

		if (THREE.CopyShader === undefined) console.error("THREE.BloomPass relies on THREE.CopyShader");

		var copyShader = THREE.CopyShader;

		this.copyUniforms = THREE.UniformsUtils.clone(copyShader.uniforms);

		this.copyUniforms["opacity"].value = strength;

		this.materialCopy = new THREE.ShaderMaterial({

			uniforms: this.copyUniforms,
			vertexShader: copyShader.vertexShader,
			fragmentShader: copyShader.fragmentShader,
			blending: THREE.AdditiveBlending,
			transparent: true

		});

		if (THREE.ConvolutionShader === undefined) console.error("THREE.BloomPass relies on THREE.ConvolutionShader");

		var convolutionShader = THREE.ConvolutionShader;

		this.convolutionUniforms = THREE.UniformsUtils.clone(convolutionShader.uniforms);

		this.convolutionUniforms["uImageIncrement"].value = THREE.BloomPass.blurX;
		this.convolutionUniforms["cKernel"].value = THREE.ConvolutionShader.buildKernel(sigma);

		this.materialConvolution = new THREE.ShaderMaterial({

			uniforms: this.convolutionUniforms,
			vertexShader: convolutionShader.vertexShader,
			fragmentShader: convolutionShader.fragmentShader,
			defines: {
				"KERNEL_SIZE_FLOAT": kernelSize.toFixed(1),
				"KERNEL_SIZE_INT": kernelSize.toFixed(0)
			}

		});

		this.needsSwap = false;

		this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
		this.scene = new THREE.Scene();

		this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
		this.quad.frustumCulled = false;
		this.scene.add(this.quad);
	};

	THREE.BloomPass.prototype = Object.assign(Object.create(THREE.Pass.prototype), {

		constructor: THREE.BloomPass,

		render: function render(renderer, writeBuffer, readBuffer, delta, maskActive) {

			if (maskActive) renderer.context.disable(renderer.context.STENCIL_TEST);

			this.quad.material = this.materialConvolution;

			this.convolutionUniforms["tDiffuse"].value = readBuffer.texture;
			this.convolutionUniforms["uImageIncrement"].value = THREE.BloomPass.blurX;

			renderer.render(this.scene, this.camera, this.renderTargetX, true);

			this.convolutionUniforms["tDiffuse"].value = this.renderTargetX.texture;
			this.convolutionUniforms["uImageIncrement"].value = THREE.BloomPass.blurY;

			renderer.render(this.scene, this.camera, this.renderTargetY, true);

			this.quad.material = this.materialCopy;

			this.copyUniforms["tDiffuse"].value = this.renderTargetY.texture;

			if (maskActive) renderer.context.enable(renderer.context.STENCIL_TEST);

			renderer.render(this.scene, this.camera, readBuffer, this.clear);
		}

	});

	THREE.BloomPass.blurX = new THREE.Vector2(0.001953125, 0.0);
	THREE.BloomPass.blurY = new THREE.Vector2(0.0, 0.001953125);
});
define('threefix/postprocessing/EffectComposer',['three'], function (_three) {
	'use strict';

	var THREE = _interopRequireWildcard(_three);

	function _interopRequireWildcard(obj) {
		if (obj && obj.__esModule) {
			return obj;
		} else {
			var newObj = {};

			if (obj != null) {
				for (var key in obj) {
					if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
				}
			}

			newObj.default = obj;
			return newObj;
		}
	}

	THREE.EffectComposer = function (renderer, renderTarget) {

		this.renderer = renderer;

		if (renderTarget === undefined) {

			var parameters = {
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
				format: THREE.RGBAFormat,
				stencilBuffer: false
			};

			var size = renderer.getDrawingBufferSize();
			renderTarget = new THREE.WebGLRenderTarget(size.width, size.height, parameters);
			renderTarget.texture.name = 'EffectComposer.rt1';
		}

		this.renderTarget1 = renderTarget;
		this.renderTarget2 = renderTarget.clone();
		this.renderTarget2.texture.name = 'EffectComposer.rt2';

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;

		this.passes = [];

		if (THREE.CopyShader === undefined) {

			console.error('THREE.EffectComposer relies on THREE.CopyShader');
		}

		if (THREE.ShaderPass === undefined) {

			console.error('THREE.EffectComposer relies on THREE.ShaderPass');
		}

		this.copyPass = new THREE.ShaderPass(THREE.CopyShader);
	};

	Object.assign(THREE.EffectComposer.prototype, {

		swapBuffers: function swapBuffers() {

			var tmp = this.readBuffer;
			this.readBuffer = this.writeBuffer;
			this.writeBuffer = tmp;
		},

		addPass: function addPass(pass) {

			this.passes.push(pass);

			var size = this.renderer.getDrawingBufferSize();
			pass.setSize(size.width, size.height);
		},

		insertPass: function insertPass(pass, index) {

			this.passes.splice(index, 0, pass);
		},

		render: function render(delta) {

			var maskActive = false;

			var pass,
			    i,
			    il = this.passes.length;

			for (i = 0; i < il; i++) {

				pass = this.passes[i];

				if (pass.enabled === false) continue;

				pass.render(this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive);

				if (pass.needsSwap) {

					if (maskActive) {

						var context = this.renderer.context;

						context.stencilFunc(context.NOTEQUAL, 1, 0xffffffff);

						this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, delta);

						context.stencilFunc(context.EQUAL, 1, 0xffffffff);
					}

					this.swapBuffers();
				}

				if (THREE.MaskPass !== undefined) {

					if (pass instanceof THREE.MaskPass) {

						maskActive = true;
					} else if (pass instanceof THREE.ClearMaskPass) {

						maskActive = false;
					}
				}
			}
		},

		reset: function reset(renderTarget) {

			if (renderTarget === undefined) {

				var size = this.renderer.getDrawingBufferSize();

				renderTarget = this.renderTarget1.clone();
				renderTarget.setSize(size.width, size.height);
			}

			this.renderTarget1.dispose();
			this.renderTarget2.dispose();
			this.renderTarget1 = renderTarget;
			this.renderTarget2 = renderTarget.clone();

			this.writeBuffer = this.renderTarget1;
			this.readBuffer = this.renderTarget2;
		},

		setSize: function setSize(width, height) {

			this.renderTarget1.setSize(width, height);
			this.renderTarget2.setSize(width, height);

			for (var i = 0; i < this.passes.length; i++) {

				this.passes[i].setSize(width, height);
			}
		}

	});

	THREE.Pass = function () {
		this.enabled = true;

		this.needsSwap = true;

		this.clear = false;

		this.renderToScreen = false;
	};

	Object.assign(THREE.Pass.prototype, {

		setSize: function setSize(width, height) {},

		render: function render(renderer, writeBuffer, readBuffer, delta, maskActive) {

			console.error('THREE.Pass: .render() must be implemented in derived pass.');
		}

	});
});
define('threefix/postprocessing/FilmPass',["three", "threefix/postprocessing/EffectComposer"], function (_three, _EffectComposer) {
	"use strict";

	var THREE = _interopRequireWildcard(_three);

	function _interopRequireWildcard(obj) {
		if (obj && obj.__esModule) {
			return obj;
		} else {
			var newObj = {};

			if (obj != null) {
				for (var key in obj) {
					if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
				}
			}

			newObj.default = obj;
			return newObj;
		}
	}

	THREE.FilmPass = function (noiseIntensity, scanlinesIntensity, scanlinesCount, grayscale) {

		THREE.Pass.call(this);

		if (THREE.FilmShader === undefined) console.error("THREE.FilmPass relies on THREE.FilmShader");

		var shader = THREE.FilmShader;

		this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);

		this.material = new THREE.ShaderMaterial({

			uniforms: this.uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader

		});

		if (grayscale !== undefined) this.uniforms.grayscale.value = grayscale;
		if (noiseIntensity !== undefined) this.uniforms.nIntensity.value = noiseIntensity;
		if (scanlinesIntensity !== undefined) this.uniforms.sIntensity.value = scanlinesIntensity;
		if (scanlinesCount !== undefined) this.uniforms.sCount.value = scanlinesCount;

		this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
		this.scene = new THREE.Scene();

		this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
		this.quad.frustumCulled = false;
		this.scene.add(this.quad);
	};

	THREE.FilmPass.prototype = Object.assign(Object.create(THREE.Pass.prototype), {

		constructor: THREE.FilmPass,

		render: function render(renderer, writeBuffer, readBuffer, delta, maskActive) {

			this.uniforms["tDiffuse"].value = readBuffer.texture;
			this.uniforms["time"].value += delta;

			this.quad.material = this.material;

			if (this.renderToScreen) {

				renderer.render(this.scene, this.camera);
			} else {

				renderer.render(this.scene, this.camera, writeBuffer, this.clear);
			}
		}

	});
});
define('threefix/postprocessing/MaskPass',["three", "threefix/postprocessing/EffectComposer"], function (_three, _EffectComposer) {
	"use strict";

	var THREE = _interopRequireWildcard(_three);

	function _interopRequireWildcard(obj) {
		if (obj && obj.__esModule) {
			return obj;
		} else {
			var newObj = {};

			if (obj != null) {
				for (var key in obj) {
					if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
				}
			}

			newObj.default = obj;
			return newObj;
		}
	}

	THREE.MaskPass = function (scene, camera) {

		THREE.Pass.call(this);

		this.scene = scene;
		this.camera = camera;

		this.clear = true;
		this.needsSwap = false;

		this.inverse = false;
	};

	THREE.MaskPass.prototype = Object.assign(Object.create(THREE.Pass.prototype), {

		constructor: THREE.MaskPass,

		render: function render(renderer, writeBuffer, readBuffer, delta, maskActive) {

			var context = renderer.context;
			var state = renderer.state;

			state.buffers.color.setMask(false);
			state.buffers.depth.setMask(false);

			state.buffers.color.setLocked(true);
			state.buffers.depth.setLocked(true);

			var writeValue, clearValue;

			if (this.inverse) {

				writeValue = 0;
				clearValue = 1;
			} else {

				writeValue = 1;
				clearValue = 0;
			}

			state.buffers.stencil.setTest(true);
			state.buffers.stencil.setOp(context.REPLACE, context.REPLACE, context.REPLACE);
			state.buffers.stencil.setFunc(context.ALWAYS, writeValue, 0xffffffff);
			state.buffers.stencil.setClear(clearValue);

			renderer.render(this.scene, this.camera, readBuffer, this.clear);
			renderer.render(this.scene, this.camera, writeBuffer, this.clear);

			state.buffers.color.setLocked(false);
			state.buffers.depth.setLocked(false);

			state.buffers.stencil.setFunc(context.EQUAL, 1, 0xffffffff);
			state.buffers.stencil.setOp(context.KEEP, context.KEEP, context.KEEP);
		}

	});

	THREE.ClearMaskPass = function () {

		THREE.Pass.call(this);

		this.needsSwap = false;
	};

	THREE.ClearMaskPass.prototype = Object.create(THREE.Pass.prototype);

	Object.assign(THREE.ClearMaskPass.prototype, {

		render: function render(renderer, writeBuffer, readBuffer, delta, maskActive) {

			renderer.state.buffers.stencil.setTest(false);
		}

	});
});
define('threefix/postprocessing/RenderPass',["three", "threefix/postprocessing/EffectComposer"], function (_three, _EffectComposer) {
	"use strict";

	var THREE = _interopRequireWildcard(_three);

	function _interopRequireWildcard(obj) {
		if (obj && obj.__esModule) {
			return obj;
		} else {
			var newObj = {};

			if (obj != null) {
				for (var key in obj) {
					if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
				}
			}

			newObj.default = obj;
			return newObj;
		}
	}

	THREE.RenderPass = function (scene, camera, overrideMaterial, clearColor, clearAlpha) {

		THREE.Pass.call(this);

		this.scene = scene;
		this.camera = camera;

		this.overrideMaterial = overrideMaterial;

		this.clearColor = clearColor;
		this.clearAlpha = clearAlpha !== undefined ? clearAlpha : 0;

		this.clear = true;
		this.clearDepth = false;
		this.needsSwap = false;
	};

	THREE.RenderPass.prototype = Object.assign(Object.create(THREE.Pass.prototype), {

		constructor: THREE.RenderPass,

		render: function render(renderer, writeBuffer, readBuffer, delta, maskActive) {

			var oldAutoClear = renderer.autoClear;
			renderer.autoClear = false;

			this.scene.overrideMaterial = this.overrideMaterial;

			var oldClearColor, oldClearAlpha;

			if (this.clearColor) {

				oldClearColor = renderer.getClearColor().getHex();
				oldClearAlpha = renderer.getClearAlpha();

				renderer.setClearColor(this.clearColor, this.clearAlpha);
			}

			if (this.clearDepth) {

				renderer.clearDepth();
			}

			renderer.render(this.scene, this.camera, this.renderToScreen ? null : readBuffer, this.clear);

			if (this.clearColor) {

				renderer.setClearColor(oldClearColor, oldClearAlpha);
			}

			this.scene.overrideMaterial = null;
			renderer.autoClear = oldAutoClear;
		}

	});
});
define('threefix/postprocessing/ShaderPass',["three", "threefix/postprocessing/EffectComposer"], function (_three, _EffectComposer) {
	"use strict";

	var THREE = _interopRequireWildcard(_three);

	function _interopRequireWildcard(obj) {
		if (obj && obj.__esModule) {
			return obj;
		} else {
			var newObj = {};

			if (obj != null) {
				for (var key in obj) {
					if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
				}
			}

			newObj.default = obj;
			return newObj;
		}
	}

	THREE.ShaderPass = function (shader, textureID) {

		THREE.Pass.call(this);

		this.textureID = textureID !== undefined ? textureID : "tDiffuse";

		if (shader instanceof THREE.ShaderMaterial) {

			this.uniforms = shader.uniforms;

			this.material = shader;
		} else if (shader) {

			this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);

			this.material = new THREE.ShaderMaterial({

				defines: Object.assign({}, shader.defines),
				uniforms: this.uniforms,
				vertexShader: shader.vertexShader,
				fragmentShader: shader.fragmentShader

			});
		}

		this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
		this.scene = new THREE.Scene();

		this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
		this.quad.frustumCulled = false;
		this.scene.add(this.quad);
	};

	THREE.ShaderPass.prototype = Object.assign(Object.create(THREE.Pass.prototype), {

		constructor: THREE.ShaderPass,

		render: function render(renderer, writeBuffer, readBuffer, delta, maskActive) {

			if (this.uniforms[this.textureID]) {

				this.uniforms[this.textureID].value = readBuffer.texture;
			}

			this.quad.material = this.material;

			if (this.renderToScreen) {

				renderer.render(this.scene, this.camera);
			} else {

				renderer.render(this.scene, this.camera, writeBuffer, this.clear);
			}
		}

	});
});
define('threefix/shaders/ConvolutionShader',["three"], function (_three) {
	"use strict";

	var THREE = _interopRequireWildcard(_three);

	function _interopRequireWildcard(obj) {
		if (obj && obj.__esModule) {
			return obj;
		} else {
			var newObj = {};

			if (obj != null) {
				for (var key in obj) {
					if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
				}
			}

			newObj.default = obj;
			return newObj;
		}
	}

	THREE.ConvolutionShader = {

		defines: {

			"KERNEL_SIZE_FLOAT": "25.0",
			"KERNEL_SIZE_INT": "25"

		},

		uniforms: {

			"tDiffuse": { value: null },
			"uImageIncrement": { value: new THREE.Vector2(0.001953125, 0.0) },
			"cKernel": { value: [] }

		},

		vertexShader: ["uniform vec2 uImageIncrement;", "varying vec2 vUv;", "void main() {", "vUv = uv - ( ( KERNEL_SIZE_FLOAT - 1.0 ) / 2.0 ) * uImageIncrement;", "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );", "}"].join("\n"),

		fragmentShader: ["uniform float cKernel[ KERNEL_SIZE_INT ];", "uniform sampler2D tDiffuse;", "uniform vec2 uImageIncrement;", "varying vec2 vUv;", "void main() {", "vec2 imageCoord = vUv;", "vec4 sum = vec4( 0.0, 0.0, 0.0, 0.0 );", "for( int i = 0; i < KERNEL_SIZE_INT; i ++ ) {", "sum += texture2D( tDiffuse, imageCoord ) * cKernel[ i ];", "imageCoord += uImageIncrement;", "}", "gl_FragColor = sum;", "}"].join("\n"),

		buildKernel: function buildKernel(sigma) {

			function gauss(x, sigma) {

				return Math.exp(-(x * x) / (2.0 * sigma * sigma));
			}

			var i,
			    values,
			    sum,
			    halfWidth,
			    kMaxKernelSize = 25,
			    kernelSize = 2 * Math.ceil(sigma * 3.0) + 1;

			if (kernelSize > kMaxKernelSize) kernelSize = kMaxKernelSize;
			halfWidth = (kernelSize - 1) * 0.5;

			values = new Array(kernelSize);
			sum = 0.0;
			for (i = 0; i < kernelSize; ++i) {

				values[i] = gauss(i - halfWidth, sigma);
				sum += values[i];
			}

			for (i = 0; i < kernelSize; ++i) {
				values[i] /= sum;
			}return values;
		}

	};
});
define('threefix/shaders/CopyShader',["three"], function (_three) {
	"use strict";

	var THREE = _interopRequireWildcard(_three);

	function _interopRequireWildcard(obj) {
		if (obj && obj.__esModule) {
			return obj;
		} else {
			var newObj = {};

			if (obj != null) {
				for (var key in obj) {
					if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
				}
			}

			newObj.default = obj;
			return newObj;
		}
	}

	THREE.CopyShader = {

		uniforms: {

			"tDiffuse": { value: null },
			"opacity": { value: 1.0 }

		},

		vertexShader: ["varying vec2 vUv;", "void main() {", "vUv = uv;", "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );", "}"].join("\n"),

		fragmentShader: ["uniform float opacity;", "uniform sampler2D tDiffuse;", "varying vec2 vUv;", "void main() {", "vec4 texel = texture2D( tDiffuse, vUv );", "gl_FragColor = opacity * texel;", "}"].join("\n")

	};
});
define('threefix/shaders/FilmShader',["three"], function (_three) {
	"use strict";

	var THREE = _interopRequireWildcard(_three);

	function _interopRequireWildcard(obj) {
		if (obj && obj.__esModule) {
			return obj;
		} else {
			var newObj = {};

			if (obj != null) {
				for (var key in obj) {
					if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
				}
			}

			newObj.default = obj;
			return newObj;
		}
	}

	THREE.FilmShader = {

		uniforms: {

			"tDiffuse": { value: null },
			"time": { value: 0.0 },
			"nIntensity": { value: 0.5 },
			"sIntensity": { value: 0.05 },
			"sCount": { value: 4096 },
			"grayscale": { value: 1 }

		},

		vertexShader: ["varying vec2 vUv;", "void main() {", "vUv = uv;", "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );", "}"].join("\n"),

		fragmentShader: ["#include <common>", "uniform float time;", "uniform bool grayscale;", "uniform float nIntensity;", "uniform float sIntensity;", "uniform float sCount;", "uniform sampler2D tDiffuse;", "varying vec2 vUv;", "void main() {", "vec4 cTextureScreen = texture2D( tDiffuse, vUv );", "float dx = rand( vUv + time );", "vec3 cResult = cTextureScreen.rgb + cTextureScreen.rgb * clamp( 0.1 + dx, 0.0, 1.0 );", "vec2 sc = vec2( sin( vUv.y * sCount ), cos( vUv.y * sCount ) );", "cResult += cTextureScreen.rgb * vec3( sc.x, sc.y, sc.x ) * sIntensity;", "cResult = cTextureScreen.rgb + clamp( nIntensity, 0.0,1.0 ) * ( cResult - cTextureScreen.rgb );", "if( grayscale ) {", "cResult = vec3( cResult.r * 0.3 + cResult.g * 0.59 + cResult.b * 0.11 );", "}", "gl_FragColor =  vec4( cResult, cTextureScreen.a );", "}"].join("\n")

	};
});
define('threefix/shaders/FocusShader',["three"], function (_three) {
	"use strict";

	var THREE = _interopRequireWildcard(_three);

	function _interopRequireWildcard(obj) {
		if (obj && obj.__esModule) {
			return obj;
		} else {
			var newObj = {};

			if (obj != null) {
				for (var key in obj) {
					if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
				}
			}

			newObj.default = obj;
			return newObj;
		}
	}

	THREE.FocusShader = {

		uniforms: {

			"tDiffuse": { value: null },
			"screenWidth": { value: 1024 },
			"screenHeight": { value: 1024 },
			"sampleDistance": { value: 0.94 },
			"waveFactor": { value: 0.00125 }

		},

		vertexShader: ["varying vec2 vUv;", "void main() {", "vUv = uv;", "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );", "}"].join("\n"),

		fragmentShader: ["uniform float screenWidth;", "uniform float screenHeight;", "uniform float sampleDistance;", "uniform float waveFactor;", "uniform sampler2D tDiffuse;", "varying vec2 vUv;", "void main() {", "vec4 color, org, tmp, add;", "float sample_dist, f;", "vec2 vin;", "vec2 uv = vUv;", "add = color = org = texture2D( tDiffuse, uv );", "vin = ( uv - vec2( 0.5 ) ) * vec2( 1.4 );", "sample_dist = dot( vin, vin ) * 2.0;", "f = ( waveFactor * 100.0 + sample_dist ) * sampleDistance * 4.0;", "vec2 sampleSize = vec2(  1.0 / screenWidth, 1.0 / screenHeight ) * vec2( f );", "add += tmp = texture2D( tDiffuse, uv + vec2( 0.111964, 0.993712 ) * sampleSize );", "if( tmp.b < color.b ) color = tmp;", "add += tmp = texture2D( tDiffuse, uv + vec2( 0.846724, 0.532032 ) * sampleSize );", "if( tmp.b < color.b ) color = tmp;", "add += tmp = texture2D( tDiffuse, uv + vec2( 0.943883, -0.330279 ) * sampleSize );", "if( tmp.b < color.b ) color = tmp;", "add += tmp = texture2D( tDiffuse, uv + vec2( 0.330279, -0.943883 ) * sampleSize );", "if( tmp.b < color.b ) color = tmp;", "add += tmp = texture2D( tDiffuse, uv + vec2( -0.532032, -0.846724 ) * sampleSize );", "if( tmp.b < color.b ) color = tmp;", "add += tmp = texture2D( tDiffuse, uv + vec2( -0.993712, -0.111964 ) * sampleSize );", "if( tmp.b < color.b ) color = tmp;", "add += tmp = texture2D( tDiffuse, uv + vec2( -0.707107, 0.707107 ) * sampleSize );", "if( tmp.b < color.b ) color = tmp;", "color = color * vec4( 2.0 ) - ( add / vec4( 8.0 ) );", "color = color + ( add / vec4( 8.0 ) - color ) * ( vec4( 1.0 ) - vec4( sample_dist * 0.5 ) );", "gl_FragColor = vec4( color.rgb * color.rgb * vec3( 0.95 ) + color.rgb, 1.0 );", "}"].join("\n")
	};
});
define('text!app.html', ['module'], function(module) { module.exports = "<template><require from=\"styles/style.css\"></require><div class=\"content\" ref=\"content\"><template containerless repeat.for=\"vm of screenVms\"><compose view-model.bind=\"vm\" model.bind=\"{index:$index+1}\" view-model.ref=\"screenRefs[$index]\"></compose></template></div><menu-bar titles.bind=\"screenRefs\"></menu-bar></template>"; });
define('text!styles/style.css', ['module'], function(module) { module.exports = "html, body {\n  background-color: rgb(67, 66, 67);\n  height: 100vh;\n  position: relative;\n  margin: 0;\n  font-family: roboto mono;\n  color: rgb(230,230,230)\n}\n\n.content {\n  width: 100%;\n  overflow-x: hidden\n}\n\n.console {\n  font-family: roboto mono;\n  font-size: 2.0em;\n  text-shadow: 0 0 20px #0C9EFF;\n  margin-top: 50px\n}\n\n.line {\n  width: 100%;\n  height: calc(99.9% * 1/3 - (30px - 30px * 1/3));\n  margin-bottom: 30px\n}\n\n.line:last-child {\n  margin-bottom: 0\n}\n\n.line * {\n  color: #0C9EFF\n}\n\n.line .strong-word * {\n  color: #BC3CF4;\n  text-shadow: 0 0 20px #BC3CF4\n}\n\n.carret {\n  border: 1px solid #0C9EFF;\n  display: inline-block;\n  width: 15px;\n  height: 0.7em;\n  box-shadow: 0 0 10px 1px #0C9EFF\n}\n\n.strong-word .word-switch:nth-of-type(2) {\n  position: absolute;\n  margin-left: -154px\n}\n\n.strong-word .word-switch:nth-of-type(3) {\n  position: absolute;\n  margin-left: -154px\n}\n\n.word-switch span {\n  display: inline-block;\n  transition: 400ms transform\n}\n\n.console-letter {\n  display: inline-block;\n  position: relative;\n  transition: 1900ms all cubic-bezier(0.21, 0.46, 0, 0.99)\n}\n\n.console-letter:hover {\n  transition: 1600ms all cubic-bezier(0.21, 0.46, 0, 0.99);\n  transform: scale(1.3)\n}\n\n.screen {\n  border: 1px solid transparent;\n  position: relative;\n  width: calc(99.9% * 9/10 - (30px - 30px * 9/10));\n  margin-left: calc(99.9% * (-1/20 * -1) - (30px - 30px * (-1/20 * -1)) + 30px) !important;\n  transform: translate3d(0,0,0)\n}\n\n.screen:nth-child(1n) {\n  float: left;\n  margin-right: 30px;\n  clear: none\n}\n\n.screen:last-child {\n  margin-right: 0\n}\n\n.screen:nth-child(10n) {\n  margin-right: 0;\n  float: right\n}\n\n.screen:nth-child(10n + 1) {\n  clear: both\n}\n\n.content > compose:last-child > .screen > .btn-next {\n  display: none\n}\n\n.screen.skills {\n  width: calc(99.9% * 1 - (30px - 30px * 1)) !important;\n  margin-left: 0 !important;\n  overflow: hidden\n}\n\n.screen.skills:nth-child(1n) {\n  float: left !important;\n  margin-right: 30px !important;\n  clear: none !important\n}\n\n.screen.skills:last-child {\n  margin-right: 0 !important\n}\n\n.screen.skills:nth-child(NaNn) {\n  margin-right: 0 !important;\n  float: right !important\n}\n\n.screen.skills:nth-child(NaNn + 1) {\n  clear: both !important\n}\n\n.btn {\n  display: flex;\n  background-color: #0C9EFF;\n  min-width: 44px;\n  min-height: 28px;\n  border: 1px solid #1CAEFF;\n  z-index: 100;\n  transition: all 0.3s ease-out;\n  cursor: pointer;\n  border-radius: 3px 3px 0 0\n}\n\n.btn:hover {\n  box-shadow: 0px 0px 12px 4px inset #8CBEFFff;\n  font-size: 0.8em !important;\n  padding-top: 0.1em\n}\n\n.btn-hidden {\n  opacity: 0\n}\n\n.btn-next {\n  position: absolute;\n  bottom: 0;\n  left: 50%;\n  margin-left: -22px\n}\n\n.btn-next::after {\n  content: '>';\n  transform: translateX(16px)rotate(90deg);\n  font-size: 1.5em\n}\n\n/*project section */\n.project-base-title {\n  width: 100%;\n  height: 30px;\n  text-align: center;\n  background-color: #0C9EFF;\n  color: rgb(67, 66, 67);\n  font-size: 1.6em;\n  font-variant: all-petite-caps;\n  z-index: 200;\n  position: absolute\n}\n\n.project-base-title span {\n  position: relative;\n  bottom: 20%\n}\n\n.project {\n  position: absolute;\n  width: 100%;\n  height: calc(100vh - 30px)\n}\n\n.project .cover-wrapper {\n  position: absolute;\n  height: 100%;\n  top: 30px\n}\n\n.project .title-wrapper {\n  position: relative;\n  width: 100%;\n  height: 40px;\n  padding-bottom: 2px\n}\n\n.project .description-wrapper {\n  position: relative;\n  height: calc(100% - 40px)\n}\n\n.project-title {\n  overflow: hidden;\n  display: flex;\n  justify-content: space-between;\n  flex-basis: 100%;\n  position: relative;\n  width: 100%;\n  height: 40px;\n  text-align: center;\n  /* background-color: #0C9EFF */\n  color: #BC3CF4;\n  border-bottom: 1px solid #0C9EFF;\n  font-size: 1.5em;\n  z-index:110 {}\n}\n\n.project-title span {\n  background-color: rgb(47, 46, 47);\n  width: 100%\n}\n\n.project-title .btn {\n  color: white;\n  font-size: 0.9em;\n  z-index: 0\n}\n\n.project-title * {\n  margin-top: 0.3em;\n  display: inline-block;\n  font-weight: 40\n}\n\n.project-cover {\n  position: absolute;\n  border: 1px solid transparent;\n  height: 100%;\n  width: 100%;\n  overflow: hidden;\n  background-color: rgb(47, 46, 47)\n}\n\n.project-cover img {\n  width: 100%\n}\n\n.image-wrapper {\n  overflow: hidden;\n  width: 100%;\n  height: 100%;\n  display: block;\n  position: absolute !important;\n  top: 50%;\n  margin-top: -30%\n}\n\n.image-wrapper.vertical {\n  top: 0;\n  margin-top: 0;\n  height: calc(100% - 34px)\n}\n\n.vertical img {\n  width: auto;\n  height: 100%;\n  margin-left: 0\n}\n\n.image-container {\n  width: 100%;\n  height: 100%;\n  display: table-cell;\n  vertical-align: middle\n}\n\n.cover-image-back {\n  width: 50px;\n  height: 100px;\n  left: 50px;\n  border: 1px solid black;\n  position: absolute\n}\n\n.cover-image-next {\n  width: 50px;\n  height: 100px;\n  right: -50px;\n  border: 1px solid black;\n  position: absolute\n}\n\nspan.cover-control {\n  border: 1px solid transparent;\n  background-color: rgb(77, 76, 77);\n  border-radius: 15px;\n  width: 7px;\n  height: 7px;\n  margin: 3px;\n  display: inline-block;\n  cursor: pointer;\n  transition: all 0.35s;\n  background-color: rgb(67, 66, 67)\n}\n  \nspan.cover-control:hover {\n  background-color: white !important;\n  box-shadow: 0 0 2px 1px white\n}\n\nspan.cover-control.active {\n  background-color: #0c9eff !important;\n  box-shadow: 0 0 2px 1px #0c9eff\n}\n\nspan.cover-control-container {\n  width: 100%;\n  height: 20px;\n  position: absolute;\n  margin: 0 auto;\n  text-align: center;\n  z-index: 11;\n  transition: all 0.3s\n}\n\nspan.cover-control-bar {\n  background-color: rgb(47, 46, 47);\n  padding-left: 15px;\n  padding-right: 15px;\n  border-radius: 10px 10px 0 0\n}\n\n.project-desc {\n  height: 100%;\n  z-index: 10;\n  top: 30px;\n  position: relative\n}\n\n.project-desc .description {\n  padding-top: 50px;\n  background-color: rgb(47, 46, 47);\n  height: calc(100% - 52px);\n  width: 100%;\n  position: absolute\n}\n\n.desc-content {\n  padding: 15px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: space-between;\n  height: 80%\n}\n\n.desc-top {\n  text-align: justify\n}\n\n.desc-bot {\n  background-color: rgba(65,65,65,1);\n  padding: 8px;\n  border-radius: 9px;\n  border: 1px solid #1caeff7d;\n  transition: all 0.35s ease-out\n}\n\n.desc-bot:hover {\n  background-color: rgba(75,75,75,1);\n  box-shadow: 0px 0px 5px 2px #1caeff7d\n}\n\nmenu-bar {\n  position: fixed;\n  top: -1px;\n  width: calc(99.9% * 9/10 - (30px - 30px * 9/10));\n  margin-left: calc(99.9% * (-1/20 * -1) - (30px - 30px * (-1/20 * -1)) + 30px) !important;\n  z-index: 999\n}\n\nmenu-bar:nth-child(1n) {\n  float: left;\n  margin-right: 30px;\n  clear: none\n}\n\nmenu-bar:last-child {\n  margin-right: 0\n}\n\nmenu-bar:nth-child(10n) {\n  margin-right: 0;\n  float: right\n}\n\nmenu-bar:nth-child(10n + 1) {\n  clear: both\n}\n\nmenu-bar .progress {\n  display: flex;\n  width: 100%;\n  left: 1px;\n  position: absolute;\n  height: 4px;\n  background-color: rgb(66, 67, 66)\n}\n\nmenu-bar .progress-foreground {\n  display: inline-block;\n  background-color: #0c9eff;\n  margin-top: 1px;\n  height: 2px;\n  width: 50%;\n  box-shadow: 0 0 2px 0px #0b8eff;\n  transition: all 0.35s ease-out\n}\n\nmenu-bar .progress-current {\n  display: inline-block;\n  background-color: #BC3CF4;\n  margin-top: 1px;\n  height: 2px;\n  width: 50%;\n  box-shadow: 0 0 2px 0px #BB2CF4;\n  transition: all 0.35s ease-out\n}\n\nmenu-bar .menu {\n  height: 0px;\n  display: flex;\n  justify-content: space-around;\n  overflow: hidden;\n  transition: all 0.35s ease-out\n}\n\nmenu-bar .menu-item {\n  flex-basis: 100%;\n  text-align: center;\n  background-color: rgb(76, 77, 76);\n  border-right: 1px solid #0c9eff;\n  cursor: pointer\n}\n\nmenu-bar .menu-item:hover {\n  background-color: rgb(66, 67, 66)\n}\n\n.screen-desc-container {\n  position: absolute;\n  display: flex;\n  flex-direction: column;\n  width: 100%;\n  height: 80%;\n  justify-content: space-evenly\n}\n\n.portrait-container {\n  display: flex\n}\n\n.portrait-container img {\n  width: 320px;\n  position: relative;\n  filter: blur(50px)hue-rotate(360deg);\n  transition: all 1s ease-out\n}\n\n.portrait-crop {\n  border-radius: 100%;\n  width: 300x;\n  height: 300px;\n  overflow: hidden;\n  box-shadow: 0px 0px 12px 4px rgba(0, 0, 0, 0.2);\n  position: relative;\n  margin: 0 auto;\n  position: relative;\n  z-index: 800;\n  opacity: 0;\n  transition: all 1s ease-in\n}\n\n.form-container {\n  width: 100%;\n  height: 100%;\n  display: flex;\n  align-items: center;\n  justify-content: space-around\n}\n\n.form-container form {\n  display: flex;\n  flex-direction: column;\n  justify-content: space-evenly;\n  height: 400px;\n  width: 400px;\n  border-radius: 100%;\n  background-color: rgb(96,97,96);\n  padding: 100px\n}\n\n.form-row {\n  display: flex;\n  justify-content: space-evenly;\n  align-items: baseline\n}\n\n.form-row > * {\n  flex-grow: 1;\n  padding: 8px;\n  margin: 5px\n}\n\ninput[type='submit'] {\n  background-image: url(img/plane.png);\n  background-repeat: no-repeat;\n  background-position: center;\n  color: transparent;\n  background-color: #0c9eff;\n  flex-basis: 50%;\n  flex-grow: 0;\n  background-size: contain;\n  background-position-y: 3px;\n  transition: background-position-x 1.8s ease-in, background-position-y 1.8s cubic-bezier(.67, .24, .63, .58)\n}\n\ninput[type='submit']:hover {\n  background-position-x: 200px;\n  background-position-y: -30px\n}\n\np {\n  text-indent: 30px\n}\n\n\n.form-error-full {\n  position: absolute;\n  width: 370px;\n  margin-top: 30px;\n  color:  #CC4CF4;\n  font-weight: 700;\n  font-size: 0.75em;\n  margin-left: -20px\n}\n\n.form-error-full.moveright {\n  text-align: right;\n  margin-left: 20px\n}\n\n.form-error-full.movedown {\n  margin-top: 165px\n}\n\n.form-row input {\n  border: 1px solid transparent;\n  border-radius: 50px;\n  flex-basis: 70%;\n  outline-style: unset\n}\n\n.flex-half {\n  flex-basis: 50%\n}\n\ntextarea {\n  resize: none;\n  border-radius: 20px;\n  outline-style: unset;\n  max-height: 150px\n}\n\n.chrome-warning {\n  width: 360px;\n  max-height: 200px;\n  border: 1px solid #0c9eff;\n  border-radius: 15px;\n  padding: 25px;\n  background-color: #606160;\n  opacity: 0;\n  transition: opacity 0.5s ease;\n  position: absolute;\n  bottom: 0;\n  left: 0\n}\n\n.show-keys {\n  width: 360px;\n  max-height: 200px;\n  border: 1px solid #0c9eff;\n  border-radius: 15px;\n  padding: 25px;\n  background-color: #606160;\n  transition: opacity 0.5s ease;\n  position: absolute;\n  bottom: 0;\n  right: 0;\n  font-size: 0.8em;\n  text-align: center;\n  opacity: 0\n}\n\n.key {\n  display: inline-block;\n  background-color: #0C9EFF;\n  width: 44px;\n  height: 28px;\n  border: 1px solid #1CAEFF;\n  z-index: 100;\n  transition: all 0.3s ease-out;\n  cursor: pointer;\n  border-radius: 3px;\n  font-size: 1.5em;\n  margin: 3px;\n  text-align: center\n}\n\n.key.up span {\n  transform: rotateZ(90deg)translate(1px, -1px);\n  display: inline-block;\n  margin-left: 2px\n}\n\n.key.down span {\n  transform: rotateZ(-90deg)translate(-4px, 1px);\n  display: inline-block;\n  margin-left: -2px\n}\n  \n\n@media all and (max-width: 1361px) {\n  .project-desc {\n    width: calc(99.9% * 1.2/3 - (30px - 30px * 1.2/3))\n  }\n  .project-desc:nth-child(1n) {\n    float: left;\n    margin-right: 30px;\n    clear: none\n  }\n  .project-desc:last-child {\n    margin-right: 0\n  }\n  .project-desc:nth-child(1n) {\n    margin-right: 0;\n    float: right\n  }\n  .project-desc:nth-child(1n + 1) {\n    clear: both\n  }\n  .project .cover-wrapper {\n    width: calc(99.9% * 1.82/3 - (30px - 30px * 1.82/3))\n  }\n  .project .cover-wrapper:nth-child(1n) {\n    float: left;\n    margin-right: 30px;\n    clear: none\n  }\n  .project .cover-wrapper:last-child {\n    margin-right: 0\n  }\n  .project .cover-wrapper:nth-child(3n) {\n    margin-right: 0;\n    float: right\n  }\n  .project .cover-wrapper:nth-child(3n + 1) {\n    clear: both\n  }\n}\n\n@media all and (min-width: 1361px) {\n  .project-desc {\n    width: calc(99.9% * 0.8/3 - (30px - 30px * 0.8/3))\n  }\n  .project-desc:nth-child(1n) {\n    float: left;\n    margin-right: 30px;\n    clear: none\n  }\n  .project-desc:last-child {\n    margin-right: 0\n  }\n  .project-desc:nth-child(1n) {\n    margin-right: 0;\n    float: right\n  }\n  .project-desc:nth-child(1n + 1) {\n    clear: both\n  }\n  .project .cover-wrapper {\n    width: calc(99.9% * 2.2/3 - (30px - 30px * 2.2/3))\n  }\n  .project .cover-wrapper:nth-child(1n) {\n    float: left;\n    margin-right: 30px;\n    clear: none\n  }\n  .project .cover-wrapper:last-child {\n    margin-right: 0\n  }\n  .project .cover-wrapper:nth-child(3n) {\n    margin-right: 0;\n    float: right\n  }\n  .project .cover-wrapper:nth-child(3n + 1) {\n    clear: both\n  }\n}\n\n"; });
define('text!screens/screen-contact.html', ['module'], function(module) { module.exports = "<template><div class=\"screen\" scroll-transform.bind=\"index\" scroll-target.bind=\"index\" scroll-next.bind=\"index\"><div class=\"form-container\"><form class=\"form\" action=\"https://formspree.io/mathieu.emilian@gmail.com\" method=\"POST\"><span class=\"form-row\"><input type=\"text\" name=\"fname\" placeholder=\"Prénom\" value.bind=\"fname & validate\"> <span class=\"form-error-full\" innerhtml.bind=\"fnameError\"></span> <input type=\"text\" name=\"lname\" placeholder=\"Nom\" value.bind=\"lname & validate\"> <span class=\"form-error-full moveright\" innerhtml.bind=\"lnameError\"></span> </span><span class=\"form-row\"><input type=\"email\" name=\"email\" placeholder=\"Votre adresse email\" value.bind=\"email & validate\"> <span class=\"form-error-full\" innerhtml.bind=\"emailError\"></span> </span><span class=\"form-row\"><textarea name=\"message\" cols=\"30\" rows=\"10\" placeholder=\"Message\" value.bind=\"message & validate\"></textarea> <span class=\"form-error-full movedown\" innerhtml.bind=\"messageError\"></span> </span><span class=\"form-row\"><input type=\"submit\" disabled.bind=\"!canSubmit\"></span></form></div></div></template>"; });
define('text!screens/screen-cv.html', ['module'], function(module) { module.exports = "<template><div class=\"screen\" ref=\"container\" scroll-transform.bind=\"index\" scroll-target.bind=\"index\" scroll-next.bind=\"index\"><embed src=\"pdf/cv.pdf\" width=\"100%\" height=\"100%\" type=\"application/pdf\"></div></template>"; });
define('text!screens/screen-desc.html', ['module'], function(module) { module.exports = "<template><div class=\"screen\" ref=\"container\" scroll-transform.bind=\"index\" scroll-target.bind=\"index\" scroll-next.bind=\"index\"><span class=\"screen-desc-container\"><console-section></console-section><span class=\"portrait-container\"><span class=\"portrait-crop\" ref=\"portraitCrop\"><img src=\"img/portrait.jpg\" alt=\"\" ref=\"portrait\"> </span></span><span class=\"chrome-warning\" ref=\"chromeWarning\">Ce site fonctionne de façon optimale dans le navigateur google chrome </span><span class=\"show-keys\" ref=\"showKeys\"><div><span class=\"key up\"><span>&lt;</span></span></div><div><span class=\"key left\"><span>&lt;</span></span><span class=\"key down\"><span>&lt;</span></span><span class=\"key right\"><span>&gt;</span></span></div><div>Vous pouvez naviguer avec les flèches</div></span></span></div></template>"; });
define('text!screens/screen-projects.html', ['module'], function(module) { module.exports = "<template><style innerhtml.bind=\"verticalImageStyle\"></style><div class=\"screen projects\" ref=\"container\" scroll-transform.bind=\"index\" scroll-target.bind=\"index\" scroll-next.bind=\"index\"><div class=\"project-base-title\"><span>Projets / expérimentations</span></div><div class=\"project\" ref=\"projectElm\"><div class=\"cover-wrapper\" ref=\"cover\" polygon-transition=\"orientation: vertical; direction:1\"><div class=\"project-cover\" repeat.for=\"project of projectData\"><div ref=\"eachImageWrapper[$index]\" class.bind=\"project.coverClass\" data-simple-slider><img class=\"cover-image\" repeat.for=\"img of project.cover\" src.bind=\"img\" alt=\"\"> <span class=\"cover-control-container\"><span class=\"cover-control-bar\"><span class=\"cover-control\" repeat.for=\"img of project.cover\" data-project.bind=\"project\" data-index.bind=\"$index\" click.delegate=\"changeSlider($event, project, $index)\"></span></span></span></div></div></div><div class=\"project-desc\"><div class=\"title-wrapper\" ref=\"title\" polygon-transition=\"orientation: horizontal; direction:1\"><div class=\"project-title\" repeat.for=\"project of projectData\"><div class=\"btn\" click.delegate=\"previousProject()\">&lt;</div><span>${project.name}</span><div class=\"btn\" click.trigger=\"nextProject()\">&gt;</div></div></div><div class=\"description-wrapper\" ref=\"description\" polygon-transition=\"orientation: horizontal; direction:-1\"><div class=\"description\" repeat.for=\"project of projectData\"><div class=\"desc-content\"><div class=\"desc-top\" innerhtml.bind=\"project.description1\"></div><div class=\"desc-bot\"><h2>Compétences développées</h2><span innerhtml.bind=\"project.description2\"></span></div></div></div></div></div></div></div></template>"; });
define('text!screens/screen-skills.html', ['module'], function(module) { module.exports = "<template><div class=\"screen skills\" ref=\"container\" scroll-transform.bind=\"index\" scroll-target.bind=\"index\" scroll-next.bind=\"index\"></div></template>"; });
define('text!resources/elements/console-section.html', ['module'], function(module) { module.exports = "<template><div class=\"console\" ref=\"_console\"><div class=\"line\" repeat.for=\"line of lines\"></div><div class=\"carret\" ref=\"carret\"></div></div></template>"; });
define('text!resources/elements/menu-bar.html', ['module'], function(module) { module.exports = "<template><div class=\"menu\" ref=\"menu\"><div repeat.for=\"t of titles\" class=\"menu-item\" click.trigger=\"goToScreen(t.currentViewModel.index)\"> ${t.currentViewModel.displayTitle}</div></div><div class=\"progress\"><div class=\"progress-foreground\" ref=\"foreground\"></div><div class=\"progress-current\" ref=\"current\"></div></div></template>"; });
define('text!resources/elements/project-showcase.html', ['module'], function(module) { module.exports = "<template containerless><div class=\"project\" ref=\"projectElm\"><div class=\"project-cover\" ref=\"coverElm\"><img src.bind=\"data.project.cover\" alt=\"\"></div><div class=\"project-desc\"><div class=\"project-title\" ref=\"titleElm\"><div class=\"btn\" click.delegate=\"previousProject()\">&lt;</div><span>${data.project.name}</span><div class=\"btn\" click.trigger=\"nextProject()\">&gt;</div></div><div class=\"description\" innerhtml.bind=\"data.project.description\" ref=\"descriptionElm\"></div></div></div></template>"; });
//# sourceMappingURL=app-bundle.js.map