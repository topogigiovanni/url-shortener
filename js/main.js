;(function(document, window, $, undefined){
	
	var modules = [];
	var $modal = {};
	var helper = {};
	var storage = new Storage();
	var urlRepository = new Repository('url');
	var userRepository = new Repository('user');
	var router = new Router();
	var profile = new Profile();

	// methods
	helper.generateUniqueID = function(){
		return Math.random().toString(36).split('').filter( function(value, index, self) { 
	        return self.indexOf(value) === index;
	    }).join('').substr(2,8);
	};
	helper.replaceAll = function(target, search, replacement) {
	    return target.replace(new RegExp(search, 'g'), replacement);
	};


	// classes
	function Storage(){
		var self = this;

		self.get = function(name, parse){
			parse = parse === false ? parse : true;
			var retrievedData = localStorage.getItem(name);
			if(parse && retrievedData)
				retrievedData = JSON.parse(retrievedData);
			// se não encontrar retorna nulo
			return retrievedData;
		};

		self.set = function(name, value){
			if(typeof value === 'object')
				value = JSON.stringify(value);
	
			return localStorage.setItem(name, value);
		};

	};

	function Repository(name){
		var self = this;
		var data = [];
	
		var _fetchData = function(){
			data = storage.get(name);
		};
		var _each = function(action){
			(data || []).forEach(action);
		};
		var _save = function(){
			storage.set(name, data);
		};

		self.find = function(id){
			var el;
			_each(function(e){
				if(e.id === id)
					el = e;
			});
			return el;
		};
		self.findAll = function(){
			return data;
		};
		self.add = function(url){
			data = data || [];
			data.push(url);
			_save();
		};
		self.update = function(el){
			_each(function(e, i){
				if(e.id === el.id)
					e = el;
			});
			_save();
		};
		self.remove = function(id){
			var index;
			_each(function(e, i){
				if(e.id === id)
					index = e;
			});
			if(index){
				data = data || [];
				data.splice(index, 1);
			}
			_save();
		};
		
		_fetchData();

	};

	function Module($scope, name, init){
		var self = this;

		self.$scope = $scope;
		self._name = name;
		self.init = function(){
			init.apply(this);
			return this;
		};
	};

	function ShortUrl(url){
		//valida se é o único id
		var newID = helper.generateUniqueID();
		while(urlRepository.find(newID)){
			newID = helper.generateUniqueID();
		};

		this.id = newID;
		this.url = url;
		this.clicks = 0;
	};
	ShortUrl.prototype.toString = function(){
		var location = window.location;
		return location.protocol + '//' + location.hostname + location.pathname + '#' + this.id;
	};
	ShortUrl.prototype.mapping = function(data){
		if(typeof data === 'object'){
			this.id = data.id;
			this.url = data.url;
			this.clicks = data.clicks;
		}
		return this;
	}

	function Profile(){
		/* *** Apenas para teste, isso deve ser implementado *** */
		var cachedUser = userRepository.findAll();
		var isAuthenticated = cachedUser && cachedUser.length ? true : false;
		this.isAuthenticated = isAuthenticated;
		if(isAuthenticated)
			cachedUser = cachedUser[0];
		/* *** *** */
		this.id = isAuthenticated ? cachedUser.id : null;
		this.name = isAuthenticated ? cachedUser.name : null;
	};
	Profile.prototype.authenticate = function(name){
		var self = this;
		self.isAuthenticated = true;
		self.id = 1; // Fixo
		self.name = name;

		userRepository.add(self);
	};

	function Router(){
		
		var _handleHash = function(){
			var hash = window.location.hash;
			return hash ? hash.replace('#', '') : '';
		}
		var hash = _handleHash();
		var onHashChange = function(hash){
			//console.log('onhashchange', hash);
			if(hash){
				var url = urlRepository.find(hash);
				console.log('redireciona para url', url);
				if(url){
					url.clicks++;
					urlRepository.update(url);
					window.location.href = url.url;
				}
			}
		};

		window.onhashchange = function(){
			hash = _handleHash();
			onHashChange(hash);
		};

		if(hash)
			onHashChange(hash);
	};

	// logic
	$(window).on('load', function(){

		// inicia modal
		new Module(
			$('#modal'),
			'modal',
			function(){
				var self = this;
				var $scope = self.$scope;
				var $content = $scope.find('.content');

				self.open = function(content, cb){
					cb = cb || function(){};
					if(content){
						$content.html(content);
						cb($content);
					};
					$scope.removeClass('hidden');
				};
				self.close = function(){
					$scope.addClass('hidden');
				};

				var bind = function(){
					$scope.find('.close').on('click', function(e){
						e.preventDefault();
						self.close();
					});
				};

				bind();

				$modal = this;
			}
		)
		.init();

		modules['uploader'] = new Module(
			$('#app'),
			'uploader',
			function(){
				var $scope = this.$scope;
				var $form = $scope.find('form');

				var handleSubmit = function(e){
					e.preventDefault();

					$scope.addClass('loading');

					var url = $form.find('input[name="url"]').val();
					url = new ShortUrl(url);

					var $resultBox = $('.upload-result');
					$resultBox.find('input').val(url.toString());
					$resultBox.removeClass('hidden');
					//console.log('$url', url);
					urlRepository.add(url);

					$resultBox.find('.copyurl').on('click', function(e){
						e.preventDefault();
						
						try{
							var copyTextarea = $resultBox.find('input').first();
							copyTextarea.select();
							var successful = document.execCommand('copy');
						}catch(err){
							window.prompt("Use os seguintes comandos para copiar: Ctrl+C, Enter", url.toString());
							console.error('Não foi possível copiar o texto');
						}
						

					});

					$scope.removeClass('loading');

				};

				$form.on('submit', handleSubmit);
			}
		);
		modules['profileHolder'] = new Module(
			$('#header'),
			'profileHolder',
			function(){
				var $scope = this.$scope;

				var appendNotAuthenticatedContent = function(){
					$scope.html($('#not-authenticated-template').html());
					bindScope();
				};
				var appendAuthenticatedContent = function(){
					var tpl = $('#authenticated-template').html();
					tpl = helper.replaceAll(tpl, '{{USER}}', profile.name);
					$scope.html(tpl);
					bindScope();
				};
				var bindScope = function(){
					var listUrlsAction = function(e){
						e.preventDefault();
						
						var bindModal = function($content){
							var removeItem = function(e){
								e.preventDefault();
								var urlID = e.target.dataset.urlId;
								if(!urlID){
									alert('Erro ao remover');
									return;
								}
								var remove = function(){
									urlRepository.remove(urlID);
									// remover elemento da tabela
									$('.list-urls-box #'+urlID).remove();
									alert('Removido com sucesso!');
								};
								var r = confirm('Você deseja realmente excluir este item?');
								if(r)
									remove();
								
							};
							$('.list-urls-box .remove').on('click', removeItem);	
						};
						var buildModel = function(){
							var urls = urlRepository.findAll() || [];
							var model = {
								list: []
							}
							urls.forEach(function(e,i){
								model.list.push(new ShortUrl().mapping(e));
							});

							return model;
						}
						var handleTemplate = function(){
							var tpl = $('#list-urls-template').html();
							var itemTpl = $('#url-item-template').html();
							var listParsedHtml = '';
							var model = buildModel();
							model.list.forEach(function(e,i){
								var _itemTpl = itemTpl;
								_itemTpl = helper.replaceAll(_itemTpl, '{{ID}}', e.id);
								_itemTpl = helper.replaceAll(_itemTpl, '{{SHORT}}', e.toString());
								_itemTpl = helper.replaceAll(_itemTpl, '{{ORIGINAL}}', e.url);
								_itemTpl = helper.replaceAll(_itemTpl, '{{CLICKS}}', e.clicks);
								listParsedHtml += _itemTpl;
							});

							tpl = helper.replaceAll(tpl, '{{LIST}}', listParsedHtml);
							return tpl;
						};
						$modal.open(handleTemplate(), bindModal);
					};
					var logoutAction = function(e){
						e.preventDefault();
						// não deveria ser responsabilidade de repositorio mas ok :)
						userRepository.remove(profile.id);
						appendNotAuthenticatedContent();
					};
					var loginAction = function(e){
						e.preventDefault();
						var tpl = $('#login-template').html();
						var bindModal = function($content){
							// Fixo
							var AUTH = {
								user: 'user',
								pass: 'pass'
							};
							var handleSuccess = function(userName){
								profile.authenticate(userName);
								$modal.close();
								appendAuthenticatedContent();
							};
							$content.find('form').on('submit', function(e){
								e.preventDefault();
								var handleError = function(){
									alert('Falha ao logar.');
								};
								var $form = $(e.target);
								var user = $form.find('.user').val();
								var pass = $form.find('.pass').val();
								if(pass && user){
									if(user == AUTH.user &&
										pass == AUTH.pass)
									{
										handleSuccess(user);

									}else
										handleError();
								}
								else
									handleError();
							});
						};
						$modal.open(tpl, bindModal);
					};

					$scope.find('.login-action').on('click', loginAction);
					$scope.find('.logout-action').on('click', logoutAction);
					$scope.find('.list-urls-action').on('click', listUrlsAction);
				};

				if(profile.isAuthenticated){
					appendAuthenticatedContent();
				}else{
					appendNotAuthenticatedContent();	
				}
			}
		);

		var initModules = function(){
			modules['uploader'].init();
			modules['profileHolder'].init();
		};

		initModules();

	});

})(document, window, $);