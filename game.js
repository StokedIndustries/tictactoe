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
				if ( self.state.turn === 'X' ) {
					//switch ui to display Human (p1) turn
					//temporarily hard coding ai player here for testing
					//throw new Error('p1!');
					self.p1.notify('X');
				}
				else {
					//switch UI to display AI (p2) turn and tell it to go
					//throw new Error('p2!');
					self.p2.notify('O');
				}
			}
		};
		
		self.start = function(pos) {
			if ( self.status === 'beginning' ) {
				self.status = 'running';
				
				if ( pos ) {
					self.state.cells[ pos ] = self.state.turn;
			
					if ( self.state.turn === 'O' ) {
						self.state.p2_moves++;
					} else {
						self.state.p1_moves++;
					}
					
					console.log('starting game with player ', self.state.turn);
					
					self.state.advanceTurn();
				}
				
				self.advanceTo( self.state );
			}
		};
		
		self.score = function(state) {
			if ( state.result !== 'in progress' ) {
				switch(true) {
					case state.result === 'X-won':
						/* p1 won */
						if ( state.turn === 'X' ) {
							return 10 - state.p1_moves;
						} else {
							return 10 - state.p2_moves;
						}
						break;
						
					case state.result === 'O-won':
						/* p2 won */
						if ( state.turn === 'X' ) {
							return -10 + state.p1_moves;
						} else {
							return -10 + state.p2_moves;
						}
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
		var self = $dd.model({
			turn: 1,
			p1_moves: 0,
			p2_moves: 0,
			result: 'in progress',
			board: [0,0,0,0,0,0,0,0,0]
		});
		
		self.clone = function() {
			return GameState(self.out());
		};
		
		self.advanceTurn = function() {
			self.turn = self.turn === 1 ? 2 : 1;
		};
		
		self.getMoves = function() {
			var indexes = [], ni;
			
			for ( ni = 0; ni < 9; ni++ ) {
				if ( self.board[ni] === 0 ) {
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
			id: 1,
			name: 'Human Player',
			kind: 'human',
			icon: 'X'
		});
		
		var count = 0;
		
		self.notify = function(turn) {
			console.log(self.name + ' turn! Make a move.');
		};
		
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
			id: 2,
			name: 'AI Player',
			kind: 'ai',
			icon: 'O'
		});
		
		function minimaxValue(state) {
			if ( state.isFinished() ) {
				return self.game.score(state);
			}
			
			var empty_cells = state.emptyCells(),
				state_score;
			
			if ( state.turn === 'X' && self.id === 2 || state.turn === 'O' && self.id === 1 ) {
				state_score = -1000;
			} else if ( state.turn === 'X' && self.id === 1 || state.turn === 'O' && self.id === 2 ) {
				state_score = 1000;
			}
			
			var next_states = empty_cells.map(function(pos) {
				return AiAction(pos).applyTo(state);
			});
			
			next_states.forEach(function(next_state) {
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
		
		self.notify = function(turn) {
			self.makeMove(turn);
		};
		
		/* We override the default makeMove to add AI functions. */
		self.makeMove = function(turn) {
			console.log(self.name + '(' + turn + ') is taking a turn now');
			var empty_cells = self.game.state.emptyCells();
			
			throw new Error('derp!');
			
			//throw new Error('derp!');
			var possible_actions = empty_cells.map(function(pos) {
				var action = AiAction(pos),
					next = action.applyTo( self.game.state );
					
				action.minimaxValue = minimaxValue( next );
				
				return action;
			});
			
			throw new Error('derp!');
			
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
			
			var next = chosen_action.applyTo( self.game.state );
			
			throw new Error('derp!');
				
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
			
			next.cells[ self.pos ] = state.turn;
			
			if ( state.turn === 'O' ) {
				next.p2_moves++;
			} else {
				next.p1_moves++;
			}
			
			next.advanceTurn();
			
			return next;
		};
		
		self.ASC = function(a, b) {
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
		
		game.p1 = Player();
		game.p2 = AiPlayer();
		
		/*	register our game with the ioc
			so we can access it from anywhere */
		$dd.ioc.register('game', function() {
			return game;
		});
		
		/*  If this is AI vs AI we need to give Player 1
			a starting position. Let's randomize it too. */
		if ( game.p1.kind === 'ai' ) {
			game.start( Math.floor( Math.random() * 8 ) );
		} else {
			game.start();
		}
	});
})();