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
			self.state.doMove(pos, player);
			UI.insertAt(pos, player.icon);
			
			var winner = self.state.checkForWinner(),
				full = self.state.isFull();
				
			if ( winner ) {
				UI.switchView('won', winner);
			} else if ( full ) {
				UI.switchView('draw');
			} else {
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
			// let's find out which player is an AI
			var p1, p2;
			$dd.dom('input[name="p2-type"]').each(function(p) {
				if ( p[0].checked ) {
					p2 = p[0].value;
				}
			});
			$dd.dom('input[name="p1-type"]').each(function(p) {
				if ( p[0].checked ) {
					p1 = p[0].value;
				}
			});
			
			if ( p1 === 'ai' ) {
				self.p1 = AiPlayer({ id: 1, icon: 'X' });
			} else {
				self.p1 = Player();
			}
			if ( p2 === 'ai' ) {
				self.p2 = AiPlayer({ id: 2, icon: 'O' });
			} else {
				self.p2 = Player();
			}
			
			// make sure we're clean
			UI.resetBoard();
			self.state = GameState();
			
			/*  If this is AI vs AI we need to give Player 1
				a starting position. Let's randomize it too. */
			if ( self.p1.kind === 'ai' ) {
				self.p1.doMove( Math.floor( Math.random() * 8 ) );
			} else {
				// notify player 1
				self.p1.notify();
			}
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
		var self = {
			turn: 1,
			p1_moves: 0,
			p2_moves: 0,
			board: [0,0,0,0,0,0,0,0,0],
			status: 'running'
		};
		
		if ( data ) {
			self.turn = data.turn;
			self.p1_moves = data.p1_moves;
			self.p2_moves = data.p2_moves;
			self.board = data.board;
		}
		
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
		
		self.getScore = function(player) {
			var winner = self.checkForWinner(),
				full = self.isFull(),
				score = 0;
			
			if ( winner ) {
				var moves = winner.id === 1 ? self.p2_moves : self.p1_moves;
				
				if ( winner.id !== player.id ) {
					score = 10 - moves;
				} else {
					score = -10 + moves;
				}
			} else if ( full ) {
				// draw
				score = 0;
			}
		
			return score;
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
			if ( self.checkForWinner() || self.isFull() ) {
				return true;
			}
			
			return false;
		};
		
		self.clone = function() {
			var nstate = {
				turn: self.turn,
				p1_moves: self.p1_moves,
				p2_moves: self.p2_moves,
				board: []
			}, ni;
			
			for ( ni = 0; ni < self.board.length; ni++ ) {
				nstate.board[ni] = self.board[ni];
			}
			
			return GameState(nstate);
		};
		
		return self;
	};
	
	/**
	 *	Player
	 *
	 *	Base model for our players. Defaults to Human Player 1.
	 */
	var Player = function(data) {
		var self = $dd.model({
			id: 1,
			kind: 'human', // bet you're wondering why we need this. you'll see soon enough as you trace your way through the game functions.
			icon: 'X'
		});
		
		self.notify = function() {
			UI.switchView('turn', self);
		};
		
		self.doMove = function(pos) {
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
			kind: 'ai',
			icon: 'O'
		});
		
		self.notify = function() {
			UI.switchView('turn', self);
			
			// ok let's find our best move!
			var move = getBestMove();
			
			// then apply it. add a bit of a delay so the human doesn't feel so sluggish ;)
			setTimeout(function() {
				self.doMove(move.pos, self);
			}, 1000);
		};
		
		function getBestMove() {
			// first we get the current game state
			var state = $dd.ioc.get('game').state;
			
			// then get available moves and feed them to the AI
			var moves = state.getMoves().map(function(pos) {
				// clone the game state
				var nstate = makeNewState(state, pos);
				// calculate the Minimax score of this new state
				var score = minimaxValue( nstate );
				
				// return score and position
				return {
					score: score,
					pos: pos
				};
			});
			
			moves = sortMoves(moves, state);
			
			// pick the first one and return it.
			return moves[0];
		};
		
		function sortMoves(moves, state) {
			// now let's sort the best possible moves by their scores. we'll use the top score.
			if ( state.turn !== self.id ) {
				// sort descending
				moves.sort( function(a, b) {
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
				// sort ascending
				moves.sort( function(a, b) {
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
			
			return moves;
		};
		
		function minimaxValue(state) {
			// return max score if game's finished
			if ( state.isFinished() ) {
				return state.getScore(self);
			}
			
			// if it's not our turn, we want to minimize the score
			var score;
			if ( state.turn !== self.id ) {
				score = -1000;
			} else {
				score = 1000;
			}
			
			// let's generate new states from the available moves
			var nstates = state.getMoves().map(function(pos) {
				return makeNewState(state, pos);
			});
			
			// calculate minimax scores for available moves in these states
			nstates.forEach(function(nstate) {
				// get minimax score. warning: this is a recursive beast
				var nscore = minimaxValue(nstate);
				
				// we wanna maximize this time
				if ( state.turn !== self.id ) {
					if ( nscore > score ) {
						score = nscore;
					}
				} else if ( nscore < score ) {
					score = nscore;
				}
			});
			
			return score;
		};
		
		function makeNewState(state, pos) {
			// clone the game state so we can work with it
			var nstate = state.clone(),
				game = $dd.ioc.get('game'),
				player = state.turn === 1 ? game.p1 : game.p2;
			
			// apply the new position
			nstate.doMove(pos, player);
			
			// advance the turn
			nstate.advance();
			
			return nstate;
		};
		
		return self.fill(data);
	};
	
	/**
	 *	UI
	 *
	 *	Providing a UI service to the game
	 */
	var UI = {
		switchView: function(view, object) {
			// hide current view
			$dd.dom('.control').each(function(obj) {
				obj.css({ display: 'none' });
			});
			
			switch(view) {
				case 'start':
					$dd.dom('#start').css({ display: 'block' });
					break;
					
				case 'won':
					$dd.dom('#win p').html('Player ' + object.id + ' wins!');
					$dd.dom('#win').css({ display: 'block' });
					break;
					
				case 'draw':
					$dd.dom('#draw').css({ display: 'block' });
					break;
					
				case 'turn':
					var turn = $dd.dom('#p' + object.id + '-turn');
					turn.css({ display: 'block' });
					if ( object.kind === 'human' ) {
						turn.html('Player ' + object.id + ' turn!');
						setTimeout(function() {
							turn.css({ display: 'none' });
						}, 1000);
					} else {
						turn.html('A.I. is thinking...');
					}
					break;
			}
		},
		
		insertAt: function(index, symbol) {
			var cell = $dd.dom('.cell').get(index);
			cell.html(symbol);
		},
		
		resetBoard: function() {
			$dd.dom('.cell').each(function(cell) {
				cell.html('');
			});
		}
	};
	
	/**
	 *	Init Game
	 *
	 *	Let's load it all up!
	 */
	$dd.init(function() {
		var game = Game();
	
		/*	register our game with the ioc
			so we can access it from anywhere */
		$dd.ioc.register('game', function() {
			return game;
		});
		
		// Listen for game start click
		$dd.dom('#start .button').on('click', function(evt) {
			game.start();
		});
		
		$dd.dom('.cell').each(function(cell) {
			cell.on('click', function(evt) {
				game.registerClick( cell[0].attributes['board-index'].value );
			});
		});
		
		$dd.dom('.fa-refresh').each(function(icon) {
			icon.on('click', function(evt) {
				UI.resetBoard();
				UI.switchView('start', {});
			});
		});
	});
})();