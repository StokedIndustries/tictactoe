;(function(){
	/**
	 *	Game
	 *
	 *	Tying everything together into a Tic Tac Toe game!
	 */
	var Game = function() {
		var self = {
			p1: null,
			p2: null,
			state: GameState(),
			status: 'not started'
		};
		
		self.doMove = function(pos, player) {
			var ui = $dd.ioc.get('ui');
			
			self.state.doMove(pos, player);
			ui.insertAt(pos, player.icon);
			
			var winner = self.state.checkForWinner(),
			full = self.state.isFull();
				
			if ( winner ) {
				console.log(winner.name + ' won!');
				ui.switchView('win', winner);
			} else if ( full ) {
				console.log('Its a draw!');
				ui.switchView('draw');
			} else {
				console.log('advancing state');
				console.table(self.state.board);
				self.advanceState();
			}
		};
		
		self.advanceState = function() {
			// switch players
			self.state.advance();
			
			// notify player
			if ( self.state.turn === 1 ) {
				self.p1.notify();
			} else {
				self.p2.notify();
			}
		};
		
		self.start = function() {
			console.log('starting game!');
			
			self.p1.notify();
		};
		
		self.registerClick = function(index) {
			index = parseInt(index);
			
			// goof proof
			if ( !self.state.isFinished() || self.status !== 'not started' ) {
				// occupado?
				if ( self.state.board[index] === 0 ) {
					var player = self.state.turn === 1 ? self.p1 : self.p2;
					player.doMove(index);
				}
			}
		};
		
		return self;
	};
	
	/**
	 *	GameState
	 *
	 *	Factory for our game states. It defaults to empty board and Player 1 turn.
	 */
	var GameState = function(data) {
		var self = $dd.model({
			turn: 1,
			p1_moves: 0,
			p2_moves: 0,
			board: [0,0,0,0,0,0,0,0,0]
		});
		
		self.advance = function() {
			self.turn = self.turn === 1 ? 2 : 1;
		};
		
		self.doMove = function(pos, player) {
			self.board[ pos ] = player;
			
			if ( player.id === 1 ) {
				self.p1_moves++;
			} else {
				self.p2_moves++;
			}
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
		
		self.getScore = function() {
			var winner = self.checkForWinner(),
				full = self.isFull(),
				obj = {
					winner: false,
					score: 0
				};
			
			if ( winner ) {
				obj.winner = winner;
				
				// here's the evil part that totally bludgeons the human. the AI always wins or ties!
				if ( winner.kind === 'human' ) {
					var moves = winner.id === 1 ? self.p2_moves : self.p1_moves;
					obj.score = 10 - moves;
				} else {
					var moves = winner.id === 1 ? self.p1_moves : self.p2_moves;
					obj.score = -10 + moves;
				}
			} else if ( full ) {
				obj.winner = 'tie';
				obj.score = 0;
			}
			
			return obj;
		};
		
		self.checkForWinner = function() {
			var win_list = [
				[0, 1, 2], //rows
				[3, 4, 5],
				[6, 7, 8],
				[0, 3, 6], //columns
				[1, 4, 7],
				[2, 5, 8],
				[0, 4, 8], //diagonals
				[2, 4, 6]
			], ni;
			
			for ( ni = 0; ni < win_list.length; ni++ ) {
				var a = self.board[ win_list[ni][0] ],
					b = self.board[ win_list[ni][1] ],
					c = self.board[ win_list[ni][2] ];
					
				if ( a === b && a === c && a !== 0 ) {
					return a;
				}
			}
			
			return false;
		};
		
		self.isFull = function() {
			var board = self.board, ni;
			
			for ( ni = 0; ni < board.length; ni++ ) {
				if ( board[ni] === 0 ) {
					return false;
				}
			}
			
			return true;
		};
		
		self.isFinished = function() {
			if ( self.isFull() || self.checkForWinner() ) {
				return true;
			}
			
			return false;
		};
		
		self.clone = function() {
			return GameState( self.out() );
		};
		
		return self.fill(data);
	};
	
	/**
	 *	Player
	 *
	 *	Base model for our players. Defaults to Human Player 1.
	 */
	var Player = function(data) {
		var self = $dd.model({
			id: 1,
			name: 'Human Player',
			kind: 'human', // bet you're wondering why we need this. you'll see soon enough as you trace your way through the game functions.
			icon: 'X',
			moves: 0
		});
		
		self.notify = function() {
			console.log(self.name + ' turn! Make a move.');
			
			$dd.ioc.get('ui').switchView('turn', self);
		};
		
		self.doMove = function(pos) {
			self.moves++;
			$dd.ioc.get('game').doMove(pos, self);
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
		
		self.notify = function() {
			console.log(self.name + ' turn! Make a move.');
			
			// ok let's find our best move!
			var move = getBestMove();
			
			console.log('found best move! applying now', move);
			
			// then apply it
			self.doMove(move.pos, self);
		};
		
		function getBestMove() {
			// first we get the current game state
			var state = $dd.ioc.get('game').state;
			
			// then get available moves and feed them to the AI
			var possible_moves = state.getMoves().map(function(pos) {
				// clone the game state so we can work with it
				var nstate = makeNewState(state, pos);
				
				// calculate the Minimax score of this new state
				var score = minimaxValue( nstate );
				
				// return score and position
				return {
					score: score,
					pos: pos
				};
			});
			
			// now let's sort the best possible moves by their scores. we'll use the top score.
			// if it's our (the AI) turn, we wanna maximize our score.
			// if it's the other player (also might be AI), we wanna minimize their score.
			if ( state.turn === self.id ) {
				possible_moves.sort( function(a, b) {
					switch(true) {
						case ( a.score > b.score ):
							return -1;
							break;
					
						case ( a.score < b.score ):
							return 1;
							break;
					
						default:
							return 0;
							break;
					}
				} );
			} else {
				possible_moves.sort( function(a, b) {
					switch(true) {
						case ( a.score < b.score ):
							return -1;
							break;
					
						case ( a.score > b.score ):
							return 1;
							break;
					
						default:
							return 0;
							break;
					}
				} );
			}
			
			// pick the first one and return it.
			return possible_moves[0];
		};
		
		function minimaxValue(state) {
			// return max score if game's finished
			if ( state.isFinished() ) {
				//console.log('finished, score: ' + state.getScore().score);
				return state.getScore().score;
			}
			
			// if it's not our turn, we want to minimize
			var score;
			if ( state.turn !== self.id ) {
				score = -1000;
			} else {
				score = 1000;
			}
			
			// let's generate new states for the available moves
			var nstates = state.getMoves().map(function(pos) {
				return makeNewState(state, pos);
			});
			
			// calculate minimax scores for available moves in these states
			nstates.forEach(function(nstate) {
				// get minimax score. warning: this is a recursive beast
				var nscore = minimaxValue(nstate);
				
				// if it's not our turn, we want to maximize the score
				if ( state.turn !== self.id ) {
					if ( nscore > score ) {
						score = nscore;
					}
				} else {
					if ( nscore < score ) {
						score = nscore;
					}
				}
			});
			
			return score;
		};
		
		function makeNewState(state, pos) {
			// clone the game state so we can work with it
			var nstate = state.clone();
			
			// apply the new position
			nstate.doMove(pos, self);
			
			// advance the turn
			nstate.advance();
			
			return nstate;
		};
		
		return self.fill(data);
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
		
		// Listen for game start click
		$dd.dom('#start').on('click', function(evt) {
			/*  If this is AI vs AI we need to give Player 1
				a starting position. Let's randomize it too. */
			if ( game.p1.kind === 'ai' ) {
				game.start( Math.floor( Math.random() * 8 ) );
			} else {
				game.start();
			}
		});
		
		$dd.dom('.cell').each(function(cell) {
			cell.on('click', function(evt) {
				game.registerClick( cell[0].attributes['board-index'].value );
			});
		});
	});
})();