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
			win_list: [
				[0, 1, 2], //rows
				[3, 4, 5],
				[6, 7, 8],
				[0, 3, 6], //columns
				[1, 4, 7],
				[2, 5, 8],
				[0, 4, 8], //diagonals
				[2, 4, 6]
			]
		};
		
		self.checkForWinner = function() {
			var ni;
			
			for ( ni = 0; ni < self.win_list.length; ni++ ) {
				var a = self.state.board[ self.win_list[ni][0] ],
					b = self.state.board[ self.win_list[ni][1] ],
					c = self.state.board[ self.win_list[ni][2] ];
					
				if ( a === b && a === c && a !== 0 ) {
					return a;
				}
			}
			
			return 0;
		};
		
		self.isFull = function() {
			var board = self.state.board, ni;
			
			for ( ni = 0; ni < board.length; ni++ ) {
				if ( board[ni] === 0 ) {
					return false;
				}
			}
			
			return true;
		};
		
		self.doMove = function(pos, player) {
			console.log('game doMove', pos, player);
			self.state.board[ pos ] = player;
			
			var winner = self.checkForWinner(),
				full = self.isFull();
				
			if ( winner ) {
				console.log(winner.name + ' won!');
			} else if ( full ) {
				console.log('Its a draw!');
			} else {
				console.log('advancing state');
				self.advanceState();
			}
		};
		
		self.advanceState = function() {
			// switch players
			self.state.turn = self.state.turn === 1 ? 2 : 1;
			
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
			board: [0,0,0,0,0,0,0,0,0]
		});
		
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
			kind: 'human',
			icon: 'X'
		});
		
		self.notify = function() {
			console.log(self.name + ' turn! Make a move.');
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
			name: 'AI Player',
			kind: 'ai',
			icon: 'O'
		});
		
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
		
		/*  If this is AI vs AI we need to give Player 1
			a starting position. Let's randomize it too. */
		if ( game.p1.kind === 'ai' ) {
			game.start( Math.floor( Math.random() * 8 ) );
		} else {
			game.start();
		}
	});
})();