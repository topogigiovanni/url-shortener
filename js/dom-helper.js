;(function(document, window, undefined){

	function $Object(list){
		this.list = [];
		if(typeof list === 'object'){
			this.list = list; //NodeList
		}

		this.length = this.list.length;
	};
	$Object.prototype._apply = function(action){
		var count = this.list.length;
		for (var i = 0; i < count ; ++i) {
		 	var item = this.list[i];
		 	try{
		 		action(item);
		 	}catch($e){
		 		console.error($e);
		 	}
		}
		return this;
	};
	$Object.prototype.on = function(eventName, callback){
		var action = function(el){
			el.addEventListener(eventName, callback, false);
		};
		return this._apply(action);
	};
	$Object.prototype.off = function(eventName, callback){
		var action = function(el){
			el.removeEventListener(eventName, callback, false);
		};
		return this._apply(action);
	};
	$Object.prototype.find = function(selector){
		// TODO - considera todo elementos
		var firstEl = this.first();
		if(firstEl){
			var el = firstEl.querySelectorAll(selector);
			if(el.length)
				return new $(el[0]);
		}
		return new $Object();
	};
	$Object.prototype.hide = function(){
		var action = function(el){
			el.style.display = 'hide';
		};
		return this._apply(action);
	};
	$Object.prototype.show = function(){
		var action = function(el){
			el.style.display = 'block';
		};
		return this._apply(action);
	};
	$Object.prototype.addClass = function(c){
		var action = function(el){
			var re = new RegExp("(^|\\s)" + c + "(\\s|$)", "g");
		    if (re.test(el.className)) return
		    el.className = (el.className + " " + c).replace(/\s+/g, " ").replace(/(^ | $)/g, "")
		};
		return this._apply(action);
	};
	$Object.prototype.removeClass = function(c){
		var action = function(el){
			var re = new RegExp("(^|\\s)" + c + "(\\s|$)", "g");
    		el.className = el.className.replace(re, "$1").replace(/\s+/g, " ").replace(/(^ | $)/g, "")
		};
		return this._apply(action);
	};
	$Object.prototype.val = function(newVal){
		var firstEl = this.first(),
			val = null;
		if(firstEl){
			if(newVal){
				firstEl.value = newVal;
			}else{
				val = firstEl.value;
			}	
		}
		return val;
	};
	$Object.prototype.first = function(){
		return this.list.length > 0 ? this.list[0] : null;
	};
	$Object.prototype.html = function(html){
		var $el = this.first();
		var innerHtml = $el.innerHTML;
		if(!html)
			return innerHtml;
		else
			$el.innerHTML = html;

	};
	$Object.prototype.outerHtml = function(){
		var $el = this.first();
		return $el.outerHTML;
	};
	$Object.prototype.remove = function(){
		var $el = this.first();
		$el.parentNode.removeChild($el);
	};

	// exporta
	window['$'] = function(selector){
		var el;
		if(typeof selector === 'string')
			el = document.querySelectorAll(selector);
		else if(typeof selector === 'object')
			el = [selector];
		else
			throw '"'+selector+'" is an invalid argument';

		return new $Object(el);
	};

})(document, window);