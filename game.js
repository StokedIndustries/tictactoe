;(function(){
	/**
	 *	Game
	 *
	 *	Tying everything together into a Tic Tac Toe game!
	 */
	var Game = function() {
		var self = {
			p1: false,
			p2: false,
			state: GameState({
				cells: ['E', 'E', 'E',
						'E', 'E', 'E',
						'E', 'E', 'E'],
				turn: 'X'
			}),
			status: 'beginning'
		};
		
		self.advanceTo = function(state) {
			console.log('advancing state');
			self.state = state;
			
			if ( state.isFinished() ) {
				console.log('doh were done');
				self.status = 'ended';
				
				switch(true) {
					case state.result === 'X-won':
						//switch UI to display Human (p1) won
						console.log('X won!');
						break;
						
					case state.result === 'O-won':
						//switch UI to display Human (p1) lost
						console.log('O won!');
						break;
						
					default:
						//switch UI to display a draw
						console.log('Game is a draw!');
						break;
				}
			}
			else {
				console.log('not quite done yet');
				if ( self.state.turn === 'X' ) {
					//switch ui to display Human (p1) turn
					//temporarily hard coding ai player here for testing
					self.p1.makeMove('X');
				}
				else {
					//switch UI to display AI (p2) turn and tell it to go
					self.p2.makeMove('O');
				}
			}
		};
		
		self.start = function() {
			if ( self.status === 'beginning' ) {
				self.status = 'running';
				self.advanceTo( self.state );
			}
		};
		
		self.score = function(state) {
			if ( state.result !== 'in progress' ) {
				switch(true) {
					case state.result === 'X-won':
						/* p1 won */
						return 10 - state.ai_moves;
						break;
						
					case state.result === 'O-won':
						/* p2 won */
						return -10 + state.ai_moves;
						break;
						
					default:
						/* draw */
						return 0;
						break;
				}
			}
		};
		
		return self;
	};
	
	/**
	 *	GameState
	 *
	 *	Model for our game states.
	 */
	var GameState = function(data) {
		/* Defining our game state model */
		var self = $dd.model({
			turn: '',
			ai_moves: 0,
			result: 'in progress',
			cells: []
		});
		//self.fill(data);
		
		self.clone = function() {
			return GameState(self.out());
		};
		
		self.advanceTurn = function() {
			self.turn = self.turn === 'X' ? 'O' : 'X';
		};
		
		/**
		 *	public function that enumerates the empty cells in state
		 *	@return [Array]: indices of all empty cells
		 */
		self.emptyCells = function() {
			var indexes = [], ni;
			
			for ( ni = 0; ni < 9; ni++ ) {
				if ( self.cells[ni] === 'E' ) {
					indexes.push(ni);
				}
			}
			
			return indexes;
		};
		
		self.isFinished = function() {
			var c = self.cells,
				available = self.emptyCells(),
				ni, ne;
				
				console.log('empty cells', available);
			
			/* Check rows */
			for ( ni = 0; ni <= 6; ni += 3 ) {
				if ( c[ni] !== 'E' && c[ni] === c[ni + 1] && c[ni + 1] === c[ni + 2] ) {
					self.result = c[ni] + '-won';
					console.log('found a row');
					return true;
				}
			}
			
			/* Check columns */
			for ( ni = 0; ni <= 2; ni++ ) {
				if ( c[ni] !== 'E' && c[ni] === c[ni + 3] && c[ni + 3] === c[ni + 6] ) {
					self.result = c[ni] + '-won';
					console.log('found a column');
					return true;
				}
			}
			
			/* Check diagonals */
			for ( ni = 0, ne = 4; ni <= 2; ni += 2, ne -= 2 ) {
				if ( c[ni] !== 'E' && c[ni] === c[ni + ne] && c[ni + ne] === c[ni + 2*ne] ) {
					self.result = c[ni] + '-won';
					console.log('found a diagonal');
					return true;
				}
			}
			
			if ( !available.length ) {
				self.result = 'draw';
				return true;
			}
			else {
				return false;
			}
		};
		
		return self.fill(data);
	};
	
	/**
	 *	Player
	 *
	 *	Base model for our players.
	 */
	var Player = function(data) {
		var self = $dd.model({
			name: 'Human Player',
			game: {}
		});
		
		self.makeMove = function() {
			
		};
		
		return self.fill(data);
	};
	
	/**
	 *	AiPlayer
	 *
	 *	AiPlayer extends Player model.
	 */
	var AiPlayer = function(data) {
		var self = Player({
			name: 'AI Player'
		});
		
		function minimaxValue(state) {
			if ( state.isFinished() ) {
				return self.game.score(state);
			}
			
			var empty_cells = state.emptyCells(),
				state_score;
			
			if ( state.turn === 'X' ) {
				state_score = -1000;
			} else {
				state_score = 1000;
			}
			
			var next_states = empty_cells.map(function(pos) {
				return AiAction(pos).applyTo(state);
			});
			
			next_states.forEach(function(next_state) {
				console.log('thinking ahead a bit...');
				var score = minimaxValue( next_state );
				
				if ( state.turn === 'X') {
					if ( score > state_score ) {
						state_score = score;
					}
				} else {
					if ( score < state_score ) {
						state_score = score;
					}
				}
			});
			
			return state_score;
		};
		
		/* We override the default makeMove to add AI functions. */
		self.makeMove = function(turn) {
			console.log(self.name + '(' + turn + ') is taking a turn now');
			var empty_cells = self.game.state.emptyCells();
			console.log('empty cells', empty_cells);
			
			var possible_actions = empty_cells.map(function(pos) {
				var action = AiAction(pos),
					next = action.applyTo( self.game.state );
					
				action.minimaxValue = minimaxValue( next );
				
				return action;
			});
			console.log('possible actions:', possible_actions.length);
			
			if ( turn === 'X' ) {
				possible_actions.sort( function(a, b) {
					switch(true) {
						case ( a.minimaxValue > b.minimaxValue ):
							return -1;
							break;
					
						case ( a.minimaxValue < b.minimaxValue ):
							return 1;
							break;
					
						default:
							return 0;
							break;
					}
				} );
			} else {
				possible_actions.sort( function(a, b) {
					switch(true) {
						case ( a.minimaxValue < b.minimaxValue ):
							return -1;
							break;
					
						case ( a.minimaxValue > b.minimaxValue ):
							return 1;
							break;
					
						default:
							return 0;
							break;
					}
				} );
			}
			
			var chosen_action = possible_actions[0];
			
			console.log('chosen pos', chosen_action.pos);
			
			var next = chosen_action.applyTo( self.game.state );
				
			//update board UI to show placed move with chosen_action.pos & turn
			//ui.insertAt(pos, turn);
			
			self.game.advanceTo(next);
		};
		
		return self.fill(data);
	};
	
	/**
	 *	AiAction
	 *
	 *	Function for doing AI Player actions.
	 */
	var AiAction = function(pos) {
		var self = {
			pos: pos,
			minimaxValue: 0
		};
		
		self.applyTo = function(state) {
			var next = state.clone();
			
			console.log('cloned state', next);
			
			next.cells[ self.pos ] = state.turn;
			
			if ( state.turn === 'O' ) {
				next.ai_moves++;
			}
			
			next.advanceTurn();
			
			return next;
		};
		
		self.ASC = function(a, b) {
			console.log('sort asc');
			switch(true) {
				case ( a.minimaxValue < b.minimaxValue ):
					return -1;
					break;
					
				case ( a.minimaxValue > b.minimaxValue ):
					return 1;
					break;
					
				default:
					return 0;
					break;
			}
		};
		
		self.DESC = function(a, b) {
			console.log('sort desc');
			switch(true) {
				case ( a.minimaxValue > b.minimaxValue ):
					return -1;
					break;
					
				case ( a.minimaxValue < b.minimaxValue ):
					return 1;
					break;
					
				default:
					return 0;
					break;
			}
		};
		
		return self;
	};
	
	/**
	 *	Init Game
	 *
	 *	Let's load it all up!
	 */
	$dd.init(function() {
		var game = Game();
		
		game.p1 = AiPlayer({
			name: 'AI 1',
			game: game
		});
		game.p2 = AiPlayer({
			name: 'AI 2',
			game: game
		});
		game.start();
		
		/*$dd.ioc.register('game', function() {
			return game;
		});*/
	});
})();