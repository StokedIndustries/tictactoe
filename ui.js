;(function(){
	/**
	 *	UI
	 *
	 *	Providing a UI service to the game
	 */
	var UI = function() {
		var self = {
			show_controls: true,
			current_view: 'initial'
		};
		
		self.switchView = function(view, object) {
			console.log('switchView', view, object);
			
			// fade out current view
			console.log('curr view', self.current_view);
			$dd.dom('#' + self.current_view).css({ display: 'none' });
			
			// set current view to new view
			self.current_view = view;
			
			switch(view) {
				case 'initial':
					break;
					
				case 'won':
					$dd.dom('#won').html(object.name + ' won!').css({ display: 'block' });
					break;
					
				case 'draw':
					break;
					
				case 'turn':
					var turn = $dd.dom('#turn');
					if ( object.kind === 'human' ) {
						turn.html('It\'s your turn!');
					} else {
						turn.html('It\'s ' + object.name +  ' \'s turn.');
					}
					turn.css({ display: 'block' });
					break;
			}
		};
		
		self.insertAt = function(index, symbol) {
			var cell = $dd.dom('.cell').get(index);
			
			cell.html(symbol);
			cell.css({
				color : symbol === 'X' ? 'green' : 'red'
			});
			cell.addClass('occupied');
		};
		
		return self;
	};
	
	/*	register UI with the ioc
		so we can access it from anywhere */
	$dd.ioc.register('ui', function() {
		var self = {
			show_controls: true,
			current_view: 'initial'
		};
		
		self.switchView = function(view, object) {
			console.log('switchView', view, object);
			
			// fade out current view
			console.log('curr view', self.current_view);
			$dd.dom('#' + self.current_view).css({ display: 'none' });
			
			// set current view to new view
			self.current_view = view;
			
			switch(view) {
				case 'initial':
					break;
					
				case 'won':
					$dd.dom('#won').html(object.name + ' won!').css({ display: 'block' });
					break;
					
				case 'draw':
					break;
					
				case 'turn':
					var turn = $dd.dom('#turn');
					if ( object.kind === 'human' ) {
						turn.html('It\'s your turn!');
					} else {
						turn.html('It\'s ' + object.name +  ' \'s turn.');
					}
					turn.css({ display: 'block' });
					break;
			}
		};
		
		self.insertAt = function(index, symbol) {
			var cell = $dd.dom('.cell').get(index);
			
			cell.html(symbol);
			cell.css({
				color : symbol === 'X' ? 'green' : 'red'
			});
			cell.addClass('occupied');
		};
		
		return self;
	});
})();