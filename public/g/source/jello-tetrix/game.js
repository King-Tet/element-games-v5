/* global Atom, Chain, Face */

const trace = console.log;

class game
{
	static init_class()
	{
		game.screen_width = 800;
		game.screen_height = 900;
	
		const Resize = ( e )=>{
			
			let wrap = document.getElementById( 'wrap' );
			
			wrap.style.left = '50%';
			wrap.style.top = '50%';
			wrap.style.transform = `translate(-50%, -50%) scale( ${ Math.min( 1 / 800 * document.body.clientWidth, 1 / 900 * document.body.clientHeight ) } )`;
		};
		addEventListener("resize", Resize );
		Resize();
		
		//game.easter_egg_played = false;
		game.easter_egg_will_play = false;
		
		//setTimeout( ()=>{ game.easter_egg_will_play = true; }, 3000 );
		
		game.sounds = true;
		game.music = true;
		game.eyes = false;
		game.free_mode = false;
		game.ToggleMusic = ()=>
		{
			game.music = !game.music;
			
			if ( !game.music )
			{
				for ( let i = 0; i < game.songs.length; i++ )
				game.songs[ i ].stop();
			}
			else
			{
				NextSong();
			}
		};
		game.ToggleSounds = ()=>
		{
			game.sounds = !game.sounds;
		};
		game.ToggleEyes = ()=>
		{
			game.eyes = !game.eyes;
		};
		game.ToggleFullScreen = ()=>
		{
			if (!document.fullscreenElement) {
			  document.documentElement.requestFullscreen();
			} else if (document.exitFullscreen) {
			  document.exitFullscreen();
			}
		};
		game.color_filters = [
			'none',
			'hue-rotate(180deg)', // alternative colors
			'saturate(0.5)', // desaturate
			'sepia(1)hue-rotate(30deg)saturate(10)', // lime
			'sepia(1)hue-rotate(30deg)saturate(10)drop-shadow(0px 0px 20px #55ff55)', // toxic
			'sepia(1)hue-rotate(60deg)saturate(10)', // green
			'sepia(1)hue-rotate(150deg)saturate(10)', // aqua
			'sepia(1)hue-rotate(210deg)saturate(10)', // gummy
			'sepia(1)hue-rotate(290deg)saturate(10)', // pinkish
			'sepia(1)hue-rotate(320deg)saturate(10)', // orangy
			'saturate(0)brightness(0)',
			'saturate(0)brightness(10)',
			'saturate(0)brightness(100)drop-shadow(0px 0px 20px #ffffff)', // glowing white
			'blur(6px)',
			'drop-shadow(0px 0px 20px #ffffff)'
		];
		game.color_filter = 0;
		game.LoopCSSBlockFilter = ()=>
		{
			game.color_filter = ( game.color_filter + 1 ) % game.color_filters.length;
		};
		
		game.frame_times = [];
		game.frame_times_last = 0;
		game.frame_times_next_update = 0;
		
		game.block_size = 30;
		game.block_size_safe = game.block_size + 10;
		
		game.game_space_width = Math.round( 500 / game.block_size ) * game.block_size + 10;
		game.game_min_x = game.screen_width / 2 - game.game_space_width / 2;
		game.game_max_x = game.screen_width / 2 + game.game_space_width / 2;
		game.game_max_y = game.screen_height - 30;
		
		game.game_over_line_y = 230;
		game.game_over_line_y_visual = 200;
		game.game_over_line_y_min = 230;
		
		game.canvas = document.getElementById('c');
		game.canvas.width = game.screen_width;
		game.canvas.height = game.screen_height;
		
		game.ctx = game.canvas.getContext( '2d', { alpha: false, desynchronized: true, willReadFrequently: false } );
		
		game.jelly_canvas = null;
		game.jelly_canvas_ctx = null;
		
		game.jelly_layer_canvas = null;
		game.jelly_layer_canvas_ctx = null;
		
		game.circle_canvases = {};

		game.best_score_today = 0;
		game.best_score_alltime = 0;
		
		try
		{
			game.best_score_alltime = localStorage.getItem( 'best_score' );
		}
		catch(e){};
		
		game.ticks_last = Date.now();
		
		game.mouse_x = 0;
		game.mouse_y = 0;
		//game.held_atom = null;
		game.held_atoms = null;
		game.held_atoms_offsets = null;
		
		game.key_left = 0;
		game.key_right = 0;
		game.key_down = 0;
		game.key_rotate = 0;
		
		game.recalc_controlled_group = false;
		game.controlled_group_rest_timer = 0;
		
		game.score = 0;
		game.erics_score = 15852;
		game.combos = [ 0, 0, 0, 0 ];
		game.score_chimes_delay = 0;
		//game.score_visual_delay = 0;
		
		game.paused = false;
		game.paused_due_to_lack_of_focus = false;
		
		//game.last_x_shift = 0;
		//game.last_y = 0;
		
		game.PIECE_T = 0;
		game.PIECE_I = 1;
		game.PIECE_QUAD = 2;
		game.PIECE_S = 2;
		game.PIECE_S_INV = 3;
		game.PIECE_L = 4;
		game.PIECE_L_INV = 5;
		
		/*game.pieces_colors = [
			'#ff00ff',
			'#00ffff',
			'#ffff00',
			'#ff0000',
			'#00ff00',
			'#ffaa00',
			'#0000ff'
		];*/
		
		game.pieces_colors = [
			'#ff66ff',
			'#66ffff',
			'#ffff66',
			'#ff6666',
			'#66ff66',
			'#ffaa66',
			'#6666ff'
		];
		
		game.pieces_map = [
`
010
111
`,
			
`
1111
`,
			
`
11
11
`,
			
`
110
011
`,
			
`
011
110
`,
			
`
001
111
`,
			
`
100
111
`,
		];
		
		game.scheduled_piece_ids = [];
		game.scheduled_piece_offset = 0;
		game.controlled_piece = null;
		
		game.game_over_timer = 0;
		
		game.will_render = false;
		game.morph_last_remain = -1;
		game.morph_last_gspeed = -1;
		game.morph_last_remain_solved = -1;
		
		//game.img_bg = new Image();
		//game.img_bg.src = 'bg.jpg';
		
		game.global_volume_default_scale = 4;
		game.global_volume = 0.5 * game.global_volume_default_scale;
		try
		{
			let v = localStorage.getItem( 'volume' );
			if ( v !== null )
			game.global_volume = v;
		}
		catch(e){};
		game.volume_element = document.getElementById('volume_element');
		game.UpdateVolumeElement = ()=>
		{
			game.volume_element.style.width=(game.global_volume/game.global_volume_default_scale*100)+'%';
		};
		game.UpdateVolumeElement();
		
		game.music_volume = 0.05;
		game.music_volume_current_scale = 1;
		game.music_volume_current_scale_target = 1;
		
		game.songs = [
			new Howl({
				src: ['1154236_Good-Night-Kitty.mp3'],
				html5: true,
				onend: NextSong,
				//volume: game.music_volume
			}),
			new Howl({
				src: ['1198318_Cotton-Candy-Puppy.mp3'],
				html5: true,
				onend: NextSong,
				//volume: game.music_volume
			})
		];
		game.current_song_id = -1;
		
		function NextSong()
		{
			if ( game.music )
			{
				game.current_song_id = ( game.current_song_id + 1 ) % game.songs.length;
				
				function attempt()
				{
					if ( document.visibilityState !== 'visible' )
					setTimeout( attempt, 100 );
					else
					{
						game.songs[ game.current_song_id ].play();

						/*if ( game.paused_due_to_lack_of_focus )
						game.songs[ game.current_song_id ].volume( 0 );
						else
						game.songs[ game.current_song_id ].volume( game.music_volume );*/

						// Sometimes fails
						game.songs[ game.current_song_id ].volume( game.music_volume * game.music_volume_current_scale * game.global_volume );
						// Hack for offscreen playback
						setTimeout( ()=>
						{
							game.songs[ game.current_song_id ].volume( game.music_volume * game.music_volume_current_scale * game.global_volume );
						}, 1 );
					}
				}
				attempt();
			}
		}
		
		game.sound_spin = new Howl({
		  src: ['spin.mp3'],
		  volume: 0.1
		});
		game.sound_impact = new Howl({
		  src: ['squish2.mp3']
		});
		game.sound_game_start = new Howl({
		  src: ['game_start_final.mp3'],
		  volume: 0.3
		});
		game.sound_game_end = new Howl({
		  src: ['game_end_final.mp3'],
		  volume: 0.3
		});
		/*game.sound_comic = new Howl({
			src: ['comic5.mp3'],
			sprite:
			{
				'rows_1_variation_1': [ 99, 1517 ],
				'rows_2_variation_1': [ 1638, 1669 ],
				'rows_3_variation_1': [ 3307, 2958 ],
				
				'rows_1_variation_2': [ 6317, 1577 ],
				'rows_2_variation_2': [ 7940, 1676 ],
				'rows_3_variation_2': [ 9601, 3140 ],
				
				'rows_1_variation_3': [ 12726, 1593 ],
				'rows_2_variation_3': [ 14349, 1653 ],
				'rows_3_variation_3': [ 15987, 2981 ],
				
				'rows_1_variation_4': [ 19013, 1593 ],
				'rows_2_variation_4': [ 20742, 1593 ],
				'rows_3_variation_4': [ 22403, 4141 ],
			},
			volume: 0.15
		});*/
		
		game.chimes = new Howl({
			src: ['chimes2.mp3'],
			volume: 0,
			loop: true
		});
		game.chimes.play();
		
		//game.sound_varieties = [ 0, 0, 0 ];
		
		game.PlaySound = ( s, sprite_name=undefined )=>
		{
			if ( game.sounds )
			{
				s.play( sprite_name );
				s.volume( game.global_volume );
			}
		};
		game.frame_impact_volume = 0;
		game.PlayImpactSound = ( volume, mass )=>
		{
			if ( volume > 0.2 )
			game.frame_impact_volume += volume * mass * 0.006;
		};
		
		game.debug_text = '';
		
		game.dim_amount = 1;
		
		game.Start = ( start_button )=>
		{
			start_button.remove();
			
			NextSong();
			
			game.StartLevel( 0 );

			const handleStart = ( e )=>
			{
				game.held_atoms = [];
				game.held_atoms_offsets = []

				if ( !game.free_mode )
				return;

				for ( let i = 0; i < Atom.atoms.length; i++ )
				{
					const a = Atom.atoms[ i ];
					const di = game.Dist2D( game.mouse_x, game.mouse_y, a.x, a.y );
					if ( di < 50 )
					{
						game.held_atoms.push( a );
						game.held_atoms_offsets.push( [ a.x - game.mouse_x, a.y - game.mouse_y ] );
						
						game.score = -99999;
					}
				}
			};
			const handleEnd = ( e )=>
			{
				game.held_atoms = null;
				game.held_atoms_offsets = null;
			};
			const handleMove = ( e )=>
			{
				game.mouse_x = e.offsetX;//pageX;
				game.mouse_y = e.offsetY;//pageY;
			};
			
			/*game.hold_xy = null;
			
			const handleStart = ( e )=>
			{
				game.hold_xy = {
					x: e.pageX,
					y: e.pageY
				};
			};
			const handleEnd = ( e )=>
			{
				if ( game.hold_xy )
				{
					game.hold_xy = null;
					game.key_left = 0;
					game.key_right = 0;
					game.key_bottom = 0;
				}
			};
			const handleMove = ( e )=>
			{
				if ( game.hold_xy )
				{
					game.mouse_x = e.pageX;
					game.mouse_y = e.pageY;

					let dx = game.mouse_x - game.hold_xy.x;
					let dy = game.mouse_y - game.hold_xy.y;
					
					//if ( Math.abs( dy ) > Math.abs( dx ) )
					if ( dy < -60 )
					{
						game.key_rotate++;
						game.recalc_controlled_group = true;
						game.hold_xy.y = game.mouse_y;
					}

					game.key_left = 0;
					game.key_right = 0;
					game.key_bottom = 0;

					//game.debug_text = dx+', '+dy;
					
					if ( Math.abs( dx ) < 30 )
					{
					}
					else
					{
						if ( dx > 0 )
						game.key_right = 1;
						else
						game.key_left = 1;
					}

					if ( dy > 30 )
					game.key_bottom = 1;
				}
			};*/

			//document.addEventListener("mousedown", handleStart, false);
			//document.addEventListener("mouseup", handleEnd, false);
			//window.addEventListener("mousemove", handleMove, false);
			
			document.addEventListener("pointerdown", handleStart, false);
			document.addEventListener("pointerup", handleEnd, false);
			document.addEventListener("pointercancel", handleEnd, false);
			document.addEventListener("pointermove", handleMove, false);

			window.addEventListener('focus', (event) => { 
				
				if ( game.paused_due_to_lack_of_focus )
				{
					if ( !game.paused )
					game.PlaySound( game.sound_game_end );
				
					game.paused_due_to_lack_of_focus = false; 
					
					game.music_volume_current_scale_target = 1;
					
					//if ( game.music )
					//if ( game.current_song_id >= 0 )
					//game.songs[ game.current_song_id ].fade( 0, game.music_volume, 2000 );
				}
			});
			window.addEventListener('blur', (event) => { 
				
				if ( !game.paused_due_to_lack_of_focus )
				{
					if ( !game.paused )
					game.PlaySound( game.sound_game_start );
				
					game.paused_due_to_lack_of_focus = true; 
					
					game.music_volume_current_scale_target = 0;
					
					//if ( game.music )
					//if ( game.current_song_id >= 0 )
					//game.songs[ game.current_song_id ].fade( game.music_volume, 0, 2000 );
				}
			});


			const keyDown = ( e )=>
			{
				if ( e.code === 'ArrowLeft' || e.code === 'KeyA' )
				{
					game.key_left = 1;
					e.preventDefault();
				}
				if ( e.code === 'ArrowRight' || e.code === 'KeyD' )
				{
					game.key_right = 1;
					e.preventDefault();
				}
				if ( e.code === 'ArrowDown' || e.code === 'KeyS' )
				{
					game.key_down = 1;
					e.preventDefault();
				}

				if ( e.code === 'ArrowUp' || e.code === 'KeyW' )
				{
					game.key_rotate++;
					game.recalc_controlled_group = true;
					e.preventDefault();
				}
				
				if ( e.code === 'Escape' )
				{
					if ( game.easter_egg_will_play )
					{
						game.easter_egg_will_play = false;
						//game.easter_egg_played = true;
						
						let el = document.getElementById( 'easter_egg' );
						el.style.display = 'none';
						
						let video = el.querySelector( 'video' );
						video.pause();
					}
					e.preventDefault();
				}

				if ( e.keyCode === 82 ) // R
				{
					game.PlaySound( game.sound_game_end );
					
					game.StartLevel( 0 );
					game.paused = false;
				}
				
				if ( e.keyCode === 80 ) // P
				{
					if ( game.paused )
					game.PlaySound( game.sound_game_end );
					else
					game.PlaySound( game.sound_game_start );
					
					game.paused = !game.paused;
				}
			};
			const keyUp = ( e )=>
			{
				if ( e.code === 'ArrowLeft' || e.code === 'KeyA' )
				{
					game.key_left = 0;
					e.preventDefault();
				}
				if ( e.code === 'ArrowRight' || e.code === 'KeyD' )
				{
					game.key_right = 0;
					e.preventDefault();
				}
				if ( e.code === 'ArrowDown' || e.code === 'KeyS' )
				{
					game.key_down = 0;
					e.preventDefault();
				}
			
			};

			window.addEventListener("keydown", keyDown, false);
			window.addEventListener("keyup", keyUp, false);

			setTimeout( game.Think, 0 );
			requestAnimationFrame( game.onEnterFrame );
		
		};
	}
	
	static Dist2D( x,y,x2,y2 )
	{
		return Math.sqrt( Math.pow(x-x2,2) + Math.pow(y-y2,2) );
	}
	
	static MakeSolid( all_atoms, params={} )
	{
		const range = params.range || 90;
		
		const color = params.color;
		
		for ( let i = 0; i < all_atoms.length; i++ )
		{
			const a = all_atoms[ i ];
			
			for ( let i2 = i + 1; i2 < all_atoms.length; i2++ )
			{
				const a2 = all_atoms[ i2 ];
				
				let di = game.Dist2D( a.x, a.y, a2.x, a2.y );
				
				if ( di <= range )
				{
					//new Chain({ p:a, c:a2, color:'rgba(0,255,0,0.5)' });
					
					params.p = a;
					params.c = a2;
					
					params.color = ( di <= 10 ) ? color : null;
					
					new Chain( params );
				}
			}
		}
	}
	
	static CreateJellyBlock( xx, yy, w, h, atoms=[], params={color:'#33ff33'} )
	{
		w = ~~( w / 10 ) * 10;
		h = ~~( h / 10 ) * 10;
		
		params.quad_group = Atom.quad_group_counter++;
		
		for ( let x = 0; x <= w; x += 10 )
		for ( let y = 0; y <= h; y += 10 )
		{
			params.x = xx + x;
			params.y = yy + y;

			atoms.push( new Atom( params ) );
		}
	}
	
	static StartLevel( level )
	{
		for ( let i = 0; i < Atom.atoms.length; i++ )
		Atom.atoms[ i ].remove();
	
		for ( let i = 0; i < Chain.chains.length; i++ )
		Chain.chains[ i ].remove();
	
		for ( let i = 0; i < Face.faces.length; i++ )
		Face.faces[ i ].remove();
	
		Atom.atoms.length = 0;
		Chain.chains.length = 0;
		Face.faces.length = 0;
		
		game.free_mode = false;
		
		game.best_score_today = Math.max( game.best_score_today, game.score );
		game.best_score_alltime = Math.max( game.best_score_alltime, game.score );
		
		// Copy [ 2 / 2 ]
		try
		{
			localStorage.setItem( 'best_score', game.best_score_alltime );
		}
		catch(e){};
		
		game.score = 0;
		
		if ( game.score_chimes_delay < 0 )
		game.score_chimes_delay = 0;
	
		game.combos = [ 0, 0, 0, 0 ];
		
		game.scheduled_piece_ids = [];
		game.controlled_piece = null;
		
		game.game_over_line_y_visual = 200;
		game.game_over_line_y = 230;
		
		game.game_over_timer = 0;
		
		//game.sound_varieties = [ 0, 0, 0 ];
		
		/*if ( 0 )
		{
			let params = { color: '#666666' };
			let atoms = [];
			game.CreateJellyBlock( 0, game.screen_height / 2, game.screen_width / 2, game.screen_height / 2, atoms, params );
			game.MakeSolid( 
				atoms, 
				{
					color: params.color,
					range: 20,
					strength: 0.002,
					break_delta: 10//Infinity
				} 
			);
		}*/
	}
	
	
	static LevelThink( dt )
	{
		if ( !game.controlled_piece )
		if ( game.scheduled_piece_ids.length > 0 )
		{
			
			let highest = Infinity;
			
			for ( let i = 0; i < Atom.atoms.length; i++ )
			if ( !Atom.atoms[ i ].broken_out )
			{
				if ( Atom.atoms[ i ].y - Atom.atoms[ i ].radius < highest )
				highest = Atom.atoms[ i ].y - Atom.atoms[ i ].radius;
			}
			
			if ( !game.free_mode && ( highest < game.game_over_line_y || game.game_over_timer >= 5000 ) )
			{
				if ( game.game_over_timer < 5000 && game.game_over_timer + dt >= 5000 )
				{
					game.PlaySound( game.sound_game_start );
					
					if ( game.best_score_alltime < game.score )
					{
						// Copy [ 1 / 2 ]
						try
						{
							localStorage.setItem( 'best_score', game.score );
						}
						catch(e){};
					}
				}
				
				game.game_over_timer += dt;

			}
			else
			//if ( game.game_over_timer < 5000 )
			{
				game.game_over_timer = 0;
			
			
				let lines_completed = 0;
				let atoms_cleared = 0;
				
				let quad_groups = {}; // Key is a quad_group_id
				
				for ( let i = 0; i < Atom.atoms.length; i++ )
				{
					const a = Atom.atoms[ i ];
					
					if ( !a.broken_out )
					{
						let quad_group_obj = quad_groups[ a.quad_group ];
						
						if ( !quad_group_obj )
						{
							quad_group_obj = {
								atoms: [ a ],
								x: a.x,
								y: a.y
							};
							
							quad_groups[ a.quad_group ] = quad_group_obj;
						}
						else
						{
							quad_group_obj.atoms.push( a );
							quad_group_obj.x += a.x;
							quad_group_obj.y += a.y;
						}
					}
				}
				let quad_groups_arr = [];
				for ( let prop in quad_groups )
				{
					let quad_group_obj = quad_groups[ prop ];
					
					quad_group_obj.x /= quad_group_obj.atoms.length;
					quad_group_obj.y /= quad_group_obj.atoms.length;
					
					quad_groups_arr.push( quad_group_obj );
				}
				for ( let y = game.game_max_y; y > 0; y -= game.block_size_safe )
				{
					const overlapped_groups = [];
					
					for ( let i = 0; i < quad_groups_arr.length; i++ )
					if ( quad_groups_arr[ i ].y > y - game.block_size_safe )
					if ( quad_groups_arr[ i ].y < y )
					{
						overlapped_groups.push( quad_groups_arr[ i ] );
					}
					
					if ( overlapped_groups.length >= 13 )
					{
						for ( let i = 0; i < overlapped_groups.length; i++ )
						{
							const quad_group_obj = overlapped_groups[ i ];
							
							for ( let i = 0; i < quad_group_obj.atoms.length; i++ )
							{
								const a = quad_group_obj.atoms[ i ];
								
								a.BreakOut();
								atoms_cleared++;
							}
						}
						
						for ( let i = 0; i < overlapped_groups.length; i++ )
						{
							const quad_group_obj = overlapped_groups[ i ];
							
							for ( let i = 0; i < quad_group_obj.atoms.length; i++ )
							{
								const a = quad_group_obj.atoms[ i ];

								for ( let i = 0; i < a.chains.length; i++ )
								//if ( a.chains[ i ].p.broken_out !== a.chains[ i ].c.broken_out || Math.random() < 0.35 )
								if ( a.chains[ i ].p.broken_out !== a.chains[ i ].c.broken_out )
								a.chains[ i ].nuked = true;
							}
						}
						
						lines_completed += 1;
					}
				}
				/*
				for ( let y = game.game_max_y; y > 0; y -= game.block_size_safe )
				{
					let c = 0;
					for ( let i = 0; i < Atom.atoms.length; i++ )
					if ( Atom.atoms[ i ].y > y - 1 - game.block_size_safe )
					if ( Atom.atoms[ i ].y < y + 1 )
					if ( !Atom.atoms[ i ].broken_out )
					c++;

					//trace( c );

					if ( c >= 204 ) // 204 was ok for solid blocks, lower values make it too easy to the point where default drop can play for a long time // 208 was perfect fit
					{
						for ( let i = 0; i < Atom.atoms.length; i++ )
						if ( Atom.atoms[ i ].y > y - 1 - game.block_size_safe )
						if ( Atom.atoms[ i ].y < y + 1 )
						if ( !Atom.atoms[ i ].broken_out )
						{
							Atom.atoms[ i ].BreakOut();
							atoms_cleared++;
						}

						for ( let i = 0; i < Atom.atoms.length; i++ )
						if ( Atom.atoms[ i ].y > y - 1 - game.block_size_safe )
						if ( Atom.atoms[ i ].y < y + 1 )
						{
							let a = Atom.atoms[ i ];

							for ( let i = 0; i < a.chains.length; i++ )
							if ( a.chains[ i ].p.broken_out !== a.chains[ i ].c.broken_out )
							a.chains[ i ].nuked = true;
						}
						
						lines_completed += 1;
					}
				}*/

				game.score += atoms_cleared * lines_completed;
				
				if ( lines_completed > 0 )
				{
					game.combos[ lines_completed - 1 ]++;
					
					game.game_over_line_y = Math.max( game.game_over_line_y_min, game.game_over_line_y - ( lines_completed * lines_completed ) * 10 );
					
					//let sound_id = Math.min( lines_completed, 3 );
					//game.PlaySound( game.sound_comic, 'rows_' + sound_id + '_variation_' + ( game.sound_varieties[ sound_id ] + 1 ) );
					//game.sound_varieties[ sound_id ] = ( game.sound_varieties[ sound_id ] + 1 ) % 4;
				}
				else
				game.game_over_line_y += 8;

				let atoms = [];

				let block_size = game.block_size;

				let piece = game.scheduled_piece_ids.shift();

				let params = { color: game.pieces_colors[ piece ] };

				let xx = 0;
				let yy = 0;

				let map = game.pieces_map[ piece ];

				let x0 = game.screen_width / 2 - ( map.indexOf( '\n', 1 ) - 1 ) * block_size / 2;
				let y0 = 100;

				for ( let i = 0; i < map.length; i++ )
				{
					let c = map.charAt( i );
					if ( c === '1' )
					{
						game.CreateJellyBlock( x0 + xx, y0 + yy, block_size, block_size, atoms, params );
					}
					else
					if ( c === '\n' )
					{
						xx = 0;
						yy += block_size + 10;
						
						game.scheduled_piece_offset += 1;
						
						continue;
					}

					xx += block_size + 10;
				}

				game.MakeSolid( 
					atoms, 
					{
						color: params.color,
						range: 20,
						strength: 0.002,
						break_delta: 10//Infinity
					} 
				);

				game.controlled_piece = atoms;
				game.controlled_group_rest_timer = -1000;
				
				let cx = 0
				let cy = 0;
				
				for ( let i = 0; i < atoms.length; i++ )
				{
					cx += atoms[ i ].x;
					cy += atoms[ i ].y;
				}
				cx /= atoms.length;
				cy /= atoms.length;
				
				let cx0 = cx + 5;
				let cy0 = cy;
				
				let best_group_values = null;
				let best_group_sum_error = Infinity;
				
				for ( let xx = -10; xx <= 10; xx += 10 )
				for ( let yy = -10; yy <= 10; yy += 10 )
				{
					cx = cx0 + xx;
					cy = cy0 + yy;

					let best_i = -1;
					let best_i2 = -1;
					let best_i3 = -1;

					let best_di = Infinity;
					let best_di2 = Infinity;
					let best_di3 = Infinity;

					for ( let i = 0; i < atoms.length; i++ )
					{
						const a = atoms[ i ];

						let di = game.Dist2D( cx - 16, cy - 5, a.x, a.y );

						if ( di < best_di )
						{
							best_di = di;
							best_i = i;
						}
					}

					for ( let i = 0; i < atoms.length; i++ )
					//if ( i !== best_i )
					{
						const a = atoms[ i ];

						let di = game.Dist2D( cx + 16, cy - 5, a.x, a.y );

						if ( di < best_di2 )
						{
							best_di2 = di;
							best_i2 = i;
						}
					}

					cx = ( atoms[ best_i ].x + atoms[ best_i2 ].x ) / 2;

					for ( let i = 0; i < atoms.length; i++ )
					//if ( i !== best_i )
					//if ( i !== best_i2 )
					{
						const a = atoms[ i ];

						let di = game.Dist2D( cx, cy + 5, a.x, a.y );

						if ( di < best_di3 )
						{
							best_di3 = di;
							best_i3 = i;
						}
					}
					
					let sum_error = best_di + best_di2 + best_di3;
					if ( sum_error < best_group_sum_error )
					{
						best_group_sum_error = sum_error;
						best_group_values = [ best_i, best_i2, best_i3 ];
					}
				}
				
				let [ best_i, best_i2, best_i3 ] = best_group_values;
				
				Face.faces.push( new Face({ left:atoms[ best_i ], right:atoms[ best_i2 ], mouth:atoms[ best_i3 ] }) );
				
				/*while ( true )
				{
					let left = atoms[ ~~( atoms.length * Math.random() ) ];
					let right = atoms[ ~~( atoms.length * Math.random() ) ];
					
					if ( left === right )
					continue;
					
					Face.faces.push( new Face({ left:left, right:right }) );
					
					break;
				}*/
			}
		}
		
		while ( game.scheduled_piece_ids.length < 5 )
		{
			let id = ~~( Math.random() * ( game.PIECE_L_INV + 1 ) );
			
			if ( game.scheduled_piece_ids.indexOf( id ) === -1 || Math.random() < 0.1 )
			game.scheduled_piece_ids.push( id );
		}
		
		if ( game.score > game.erics_score )
		{
			game.erics_score = Infinity;
			game.easter_egg_will_play = true;
		}
	}
	
	static MorphWithTimeScale_prepare( remain, _GSPEED )
	{
		return Math.pow( remain, _GSPEED );
	}
	static MorphWithTimeScale_do( current, to, prepared_remain )
	{
		return to * ( 1 - prepared_remain ) + current * prepared_remain;
	}
	
	static MorphWithTimeScale( current, to, remain, _GSPEED, snap_range=0 )
	{
		if ( game.morph_last_remain === remain && game.morph_last_gspeed === _GSPEED )
		{
			remain = game.morph_last_remain_solved;
		}
		else
		{
			game.morph_last_remain = remain;
			game.morph_last_gspeed = _GSPEED;
			
			remain = Math.pow( remain, _GSPEED );
			
			game.morph_last_remain_solved = remain;
		}
		current = to * ( 1 - remain ) + current * remain;
		
		if ( snap_range !== 0 )
		if ( Math.abs( current - to ) <= snap_range )
		return to;

		return current;
	}
	
	static Render()
	{
		const ctx = game.ctx;
		
		const color_main_bg = '#111122';
		
		const color_in_game_bg = '#333344';//'#b68a78';
		const color_in_game_lines = '#222233';//'#9f7362';
		
		const color_game_over_line = '#aa5555';
		
		const color_pop_up = '#ffffff';
		const color_pop_up_subtext = '#ffff00';
		
		const color_ui_text = '#3366aa';
		const color_ui_text_header = '#6699dd';
		
		ctx.fillStyle = color_main_bg;
		ctx.fillRect( 0, 0, game.screen_width, game.screen_height );
		
		ctx.fillStyle = color_in_game_bg;
		ctx.fillRect( game.screen_width / 2 - game.game_space_width / 2, 0, game.game_space_width, game.game_max_y );
		
		ctx.fillStyle = color_in_game_lines;
		for ( let y = game.game_max_y; y > 0; y -= game.block_size_safe )
		//if ( (y-game.game_max_y) % ( game.block_size_safe * 2 ) === 0 )
		{
			ctx.fillRect( game.screen_width / 2 - game.game_space_width / 2, y - game.block_size_safe, game.game_space_width, 1 );
		}
		
		/*ctx.save();
		{
			ctx.globalCompositeOperation = 'multiply';
			ctx.drawImage( game.img_bg, 0, 0 );
		}
		ctx.restore();*/
		
		
		if ( !game.free_mode )
		{
			ctx.fillStyle = color_game_over_line;
			ctx.fillRect( game.screen_width / 2 - game.game_space_width / 2, game.game_over_line_y_visual, game.game_space_width, 2 );
			ctx.font = '14px Arial';
			ctx.fillText( 'Game over line', game.screen_width / 2 - game.game_space_width / 2 + 4, game.game_over_line_y_visual - 5 );

			ctx.font = '20px Arial';
			ctx.fillStyle = '#ffffff';
			ctx.fillText( game.debug_text, 30, 100 );
		}
		
		if ( !game.jelly_canvas )
		{
			game.jelly_canvas = document.createElement('canvas');
			game.jelly_canvas.width = game.screen_width;
			game.jelly_canvas.height = game.screen_height;
			game.jelly_canvas_ctx = game.jelly_canvas.getContext( '2d', { alpha: true, desynchronized: true, willReadFrequently: false } );
			
			game.jelly_layer_canvas = document.createElement('canvas');
			game.jelly_layer_canvas.width = game.screen_width;
			game.jelly_layer_canvas.height = game.screen_height;
			game.jelly_layer_canvas_ctx = game.jelly_layer_canvas.getContext( '2d', { alpha: true, desynchronized: true, willReadFrequently: false } );
		}
		
		// Prepare jelly canvas
		
		let ctx2 = game.jelly_canvas_ctx;
		ctx2.clearRect( 0, 0, game.screen_width, game.screen_height );

		let ctx3 = game.jelly_layer_canvas_ctx;
		ctx3.clearRect( 0, 0, game.screen_width, game.screen_height );
		
		for ( let i = 0; i < Atom.atoms.length; i++ )
		{
			const a = Atom.atoms[ i ];

			/*ctx2.fillStyle = a.color;
			ctx2.beginPath();
			ctx2.arc( a.x, a.y, a.radius, 0, 2 * Math.PI, false );
			ctx2.fill();*/
			
			if ( game.circle_canvases[ a.color ] )
			{
			}
			else
			{
				game.circle_canvases[ a.color ] = document.createElement('canvas');
				game.circle_canvases[ a.color ].width = a.radius * 2;
				game.circle_canvases[ a.color ].height = a.radius * 2;
				
				let ctx_circle = game.circle_canvases[ a.color ].getContext( '2d', { alpha: true, desynchronized: true, willReadFrequently: false } );
				
				
				ctx_circle.fillStyle = a.color;
				ctx_circle.beginPath();
				ctx_circle.arc( a.radius, a.radius, a.radius, 0, 2 * Math.PI, false );
				ctx_circle.fill();
			}
		
			ctx2.drawImage( game.circle_canvases[ a.color ], a.x - a.radius, a.y - a.radius );
		}

		let strokeStyle = '';
		ctx2.lineWidth = 10;
		
		//if(0)
		for ( let i = 0; i < Chain.chains.length; i++ )
		{
			const c = Chain.chains[ i ];
			if ( c.color !== null )
			{
				// First approach is faster
				/*if ( i % 2 === 0 )
				{*/
				
					if ( strokeStyle !== c.color )
					{
						ctx2.strokeStyle = c.color;
						strokeStyle = c.color;
					}
					else
					{
					}
					//ctx2.lineWidth = ( Math.min( c.p.radius, c.c.radius ) ) * 2;
					ctx2.beginPath();
					ctx2.moveTo( c.p.x, c.p.y );
					ctx2.lineTo( c.c.x, c.c.y );
					ctx2.stroke();
				/*}
				else
				{
					ctx2.fillStyle = c.color;
					
					ctx2.save();
					{
						ctx2.translate( c.p.x, c.p.y );
						ctx2.rotate( Math.atan2( c.c.x - c.p.x, -c.c.y + c.p.y ) - Math.PI / 2 );
						
						let di = game.Dist2D( c.p.x, c.p.y, c.c.x, c.c.y );
						
						ctx2.fillRect( 0, -c.p.radius, di, 2 * c.p.radius );
					}
					ctx2.restore();
				}*/
			}
		}
		ctx3.save();
		{
			ctx3.globalCompositeOperation = 'overlay';
			ctx3.globalAlpha = 0.6;
			
			for ( let a = 0; a < 8; a++ )
			{
				let an = a / 8 * Math.PI * 2;
				
				let xx = Math.sin( an ) * 5;
				let yy = Math.cos( an ) * 5;
			
				ctx3.filter = 'brightness(' +( (a%3)/3 + 0.5 ) + ')';
				ctx3.drawImage( game.jelly_canvas, xx, yy );
			}
			
			ctx3.filter = 'none';
			ctx3.globalAlpha = 0.6;
			ctx3.globalCompositeOperation = 'destination-out';
			ctx3.drawImage( game.jelly_canvas, 0, 0 );
		}
		ctx3.restore();
		
		ctx.filter = game.color_filters[ game.color_filter ];
		ctx.drawImage( game.jelly_layer_canvas, 0, 0 );
		ctx.filter = 'none';
		
		if ( game.eyes )
		for ( let i = 0; i < Face.faces.length; i++ )
		{
			const f = Face.faces[ i ];
			
			for ( let i = 0; i < f.eyes.length; i++ )
			if ( !f.eyes[ i ].nuked )
			{
				const e = f.eyes[ i ];
				
				ctx.save();
				{
					ctx.translate( e.x, e.y );
					
					ctx.fillStyle = '#000000';
					ctx.fillRect( -8, -1, 16, 2 );
					
					ctx.scale( f.scale_x, f.scale_y );
				
					ctx.beginPath();
					ctx.arc( 0, 0, 8, 0, 2 * Math.PI, false );
					ctx.fill();

					ctx.fillStyle = 'rgba(255,255,255,0.8)';
					ctx.beginPath();
					ctx.arc( 0, 0, 6, 0, 2 * Math.PI, false );
					ctx.fill();

					let dx = f.look_x_slow - e.x;
					let dy = f.look_y_slow - e.y;

					dx *= 0.1;
					dy *= 0.1;

					let di = game.Dist2D( dx, dy, 0, 0 );

					if ( di > 1 )
					{
						dx /= di;
						dy /= di;
					}

					ctx.fillStyle = '#000000';
					ctx.beginPath();
					ctx.arc( dx*3, dy*3, 3, 0, 2 * Math.PI, false );
					ctx.fill();
				
				}
				ctx.restore();
			}
			
			let e = f.mouth;
			
			if ( !e.nuked )
			if ( !f.eyes[ 0 ].nuked )
			if ( !f.eyes[ 1 ].nuked )
			{
				let an = -Math.PI / 2 - Math.atan2( f.eyes[ 0 ].x - f.eyes[ 1 ].x, f.eyes[ 0 ].y - f.eyes[ 1 ].y );
				
				ctx.save();
				{
					ctx.translate( e.x, e.y );
					ctx.rotate( an );
					
					const openness_scale = 0.5
					ctx.scale( 1 + f.mouth_opennes * openness_scale, 1 + f.mouth_opennes * openness_scale );
					ctx.translate( 0, f.mouth_opennes * 5 * openness_scale );
					
					ctx.strokeStyle = '#000000';
					ctx.lineWidth = 2;
					
					ctx.beginPath();
					ctx.moveTo( -5, -5 );
					ctx.bezierCurveTo( -5,0, 5,0, 5,-5 );
					ctx.stroke();
					
					
					
					ctx.beginPath();
					ctx.moveTo( -5, -5 );
					ctx.bezierCurveTo( -5,0, 5,0, 5,-5 );
					//ctx.lineTo( -5, -5 );
					ctx.clip();
					
					
					ctx.fillStyle = 'rgba(0,0,0,0.1)';
					ctx.fillRect( -5,0 - f.mouth_opennes * 5, 10,5 );
					
					ctx.fillStyle = '#000000';
					ctx.fillRect( -5,0 - f.mouth_opennes * 5, 10,2 );

				}
				ctx.restore();
			}
		}
		
			
		function numberWithSpaces(x) {
			return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
		}

		// UI
		ctx.save();
		{
			ctx.font = 'bold 16px Arial';
			ctx.fillStyle = 'rgba(100,150,255,0.15)';
			
			ctx.fillText( game.frame_times_last + ' FPS', 20, game.screen_height - 20 );
			
			ctx.translate( game.screen_width / 2 + game.game_space_width / 2, 0 );
			
			ctx.font = 'bold 24px Arial';
			ctx.fillStyle = color_ui_text_header;
			ctx.fillText( 'Next', 20, 50 );
			ctx.fillStyle = color_ui_text;
			
			if ( game.controlled_group_rest_timer > 0 )
			if ( game.controlled_group_rest_timer < 1000 )
			{
				ctx.beginPath();
				ctx.strokeStyle = color_ui_text_header;//'#ffffff';
				ctx.lineWidth = 3;
				ctx.arc( 90, 42, 5, 0, Math.PI * 2 * ( 1 - game.controlled_group_rest_timer / 1000 ) );
				ctx.stroke();
			}

			let xx = 0;
			let yy = 60 + game.scheduled_piece_offset * ( 8 + 2 );

			for ( let i = 0; i < game.scheduled_piece_ids.length; i++ )
			{
				let map = game.pieces_map[ game.scheduled_piece_ids[ i ] ];

				let block_size = 8;

				for ( let i = 0; i < map.length; i++ )
				{
					let c = map.charAt( i );
					if ( c === '1' )
					{
						ctx.fillRect( 50 + xx, yy, block_size, block_size );
					}
					else
					if ( c === '\n' )
					{
						xx = 0;
						yy += block_size + 2;
						continue;
					}

					xx += block_size + 2;
				}
			}

			if ( game.score >= 0 )
			{
				ctx.fillStyle = color_ui_text_header;
				ctx.fillText( 'Score', 20, 250 );
				ctx.fillStyle = color_ui_text;
				ctx.save();
				{
					ctx.textAlign = 'right';
					//ctx.fillText( numberWithSpaces( game.score ), 130, 280 );
					ctx.fillText( numberWithSpaces( Math.ceil( game.score_chimes_delay ) ), 130, 290 );
				}
				ctx.restore();
			}

			ctx.fillStyle = color_ui_text_header;
			ctx.fillText( 'Combos', 20, 340 );
			ctx.fillStyle = color_ui_text;
			ctx.save();
			{
				ctx.textAlign = 'left';
				for ( let i = 0; i < game.combos.length; i++ )
				ctx.fillText( (i+1)+' x '+game.combos[ i ], 20, 380 + i * 30 );
			}
			ctx.restore();
		}
		ctx.restore();
		
		ctx.save();
		
		//if ( game.game_over_timer < 5000 ) // Hack
		//game.game_over_timer = 5000;
		
		ctx.fillStyle = 'rgba(0,0,0,'+game.dim_amount+')';
		ctx.fillRect( 0, 0, game.screen_width, game.screen_height );
	
		if ( game.game_over_timer >= 5000 )
		{
			ctx.fillStyle = color_pop_up;
			ctx.font = 'bold 60px Arial';
			ctx.textAlign = 'center';
			ctx.fillText( 'Game over', game.screen_width / 2, game.screen_height / 2 );
			
			
			if ( game.score >= 0 )
			if ( game.game_over_timer >= 6000 )
			{
				ctx.font = 'bold 30px Arial';
				ctx.fillText( 'Score: ' + numberWithSpaces( game.score ), game.screen_width / 2, game.screen_height / 2 + 40 );
				
			}	
			
			ctx.fillStyle = color_pop_up_subtext;
			if ( game.game_over_timer >= 6333 )
			{
				ctx.font = 'bold 16px Arial';
				ctx.fillText( 'Best today: ' + numberWithSpaces( game.best_score_today ), game.screen_width / 2, game.screen_height / 2 + 70 );
			}	
			if ( game.game_over_timer >= 6666 )
			{
				ctx.font = 'bold 16px Arial';
				ctx.fillText( 'Best all-time: ' + numberWithSpaces( game.best_score_alltime ), game.screen_width / 2, game.screen_height / 2 + 100 );
			}
			
			if ( game.game_over_timer >= 7000 )
			{
				ctx.font = 'bold 20px Arial';
				ctx.fillStyle = color_pop_up;
				ctx.fillText( 'Press R to restart', game.screen_width / 2, game.screen_height / 2 + 140 );
			}
		}
		else
		{
			if ( game.paused || game.paused_due_to_lack_of_focus )
			{
				ctx.fillStyle = color_pop_up;
				ctx.font = 'bold 40px Arial';
				ctx.textAlign = 'center';
				ctx.fillText( 'Game paused', game.screen_width / 2, game.screen_height / 2 );
				
				ctx.font = 'bold 20px Arial';
				ctx.fillStyle = color_pop_up;
				if ( game.paused )
				ctx.fillText( 'Press P to unpause', game.screen_width / 2, game.screen_height / 2 + 40 );
				else
				ctx.fillText( 'Click to unpause', game.screen_width / 2, game.screen_height / 2 + 40 );
			}
		}
		ctx.restore();
	}
	
	static Think()
	{
		if ( game.will_render )
		{
		}
		else
		{
			game.frame_impact_volume = 0;
			
			let ticks_now = Date.now();
			let dt = Math.min( ticks_now - game.ticks_last, 32 );
			game.ticks_last = ticks_now;
			
			
			if ( game.music_volume_current_scale > game.music_volume_current_scale_target )
			game.music_volume_current_scale = Math.max( game.music_volume_current_scale - dt * 0.001, game.music_volume_current_scale_target );
			else
			game.music_volume_current_scale = Math.min( game.music_volume_current_scale + dt * 0.001, game.music_volume_current_scale_target );
		
			game.songs[ game.current_song_id ].volume( game.music_volume * game.music_volume_current_scale * game.global_volume * ( 1 - game.dim_amount ) );
			
			
			
			
			let dim_target = 0;
			
			if ( game.paused || game.paused_due_to_lack_of_focus )
			{
				dim_target = 0.5;
			}
			
			if ( game.easter_egg_will_play )
			if ( !game.paused )
			if ( !game.paused_due_to_lack_of_focus )
			if ( game.sounds )
			{
				dim_target = 1;
				
				if ( game.dim_amount >= 1 )
				{
					let el = document.getElementById( 'easter_egg' );
					if ( el.style.display !== 'block' )
					{
						el.style.display = 'block';

						let video = el.querySelector( 'video' );

						video.onpause = ()=>
						{
							game.easter_egg_will_play = false;
							el.style.display = 'none';
						};
						video.volume = Math.min( 1, game.global_volume );
						video.play();
						
						//game.easter_egg_played = true;
					}
				}
			}
			
			if ( game.dim_amount > dim_target )
			game.dim_amount = Math.max( game.dim_amount - dt * 0.001, dim_target );
			else
			game.dim_amount = Math.min( game.dim_amount + dt * 0.001, dim_target );
		
			dt *= ( 1 - game.dim_amount );

			if ( !game.paused )
			if ( !game.paused_due_to_lack_of_focus )
			if ( dt > 0 )
			{
				// dt

				game.LevelThink( dt );
				
				game.scheduled_piece_offset = game.MorphWithTimeScale( game.scheduled_piece_offset, 0, 0.99, dt, 0.1 );

				game.game_over_line_y_visual = game.MorphWithTimeScale( game.game_over_line_y_visual, game.game_over_line_y, 0.99, dt, 0.1 );

				const steps = Math.ceil( dt / 16 * 3 ); // 4 was good before forces were added // 8
				dt /= steps;
				for ( let i = 0; i < steps; i++ )
				{
					//if ( game.held_atom )
					if ( game.held_atoms )
					{
						for ( let h = 0; h < game.held_atoms.length; h++ )
						{
							let p = {
								x: game.mouse_x + game.held_atoms_offsets[ h ][ 0 ],
								y: game.mouse_y + game.held_atoms_offsets[ h ][ 1 ],
								sx: 0,
								sy: 0,
								mass: 1
							};
							Chain.Push( p, game.held_atoms[ h ], 0, 0.00004, dt );
						}
					}
					
					if ( game.recalc_controlled_group )
					{
						game.recalc_controlled_group = false;
						
						if ( game.controlled_piece )
						{
							let cx = 0;
							let cy = 0;
							for ( let i = 0; i < game.controlled_piece.length; i++ )
							{
								let a = game.controlled_piece[ i ];

								cx += a.x;
								cy += a.y;
							}
							cx /= game.controlled_piece.length;
							cy /= game.controlled_piece.length;

							let closest_a = null;
							let closest_di = Infinity;

							for ( let i = 0; i < game.controlled_piece.length; i++ )
							{
								let a = game.controlled_piece[ i ];

								let di = game.Dist2D( a.x, a.y, cx, cy );
								if ( di < closest_di )
								{
									closest_di = di;
									closest_a = a;
								}
							}

							let real_controlled_group = new Set();
							let scheduled_atoms = [ closest_a ];
							
							while ( scheduled_atoms.length > 0 )
							{
								let a = scheduled_atoms.shift();
								
								if ( real_controlled_group.has( a ) )
								{
								}
								else
								{
									real_controlled_group.add( a );
									
									for ( let i = 0; i < a.chains.length; i++ )
									{
										let c = a.chains[ i ];
										
										if ( c.nuked )
										continue;
										
										if ( c.p !== a )
										if ( !real_controlled_group.has( c.p ) )
										scheduled_atoms.push( c.p );
										
										if ( c.c !== a )
										if ( !real_controlled_group.has( c.c ) )
										scheduled_atoms.push( c.c );
									}
								}
							}
							
							real_controlled_group = [ ...real_controlled_group ];
							
							if ( real_controlled_group.length !== game.controlled_piece.length )
							game.controlled_piece = real_controlled_group;

							while ( game.key_rotate > 0 )
							{
								game.key_rotate--;
								
								three:
								for ( let u = 0; u <= 1; u = u === 0 ? -1 : u === -1 ? 1 : 2 )
								for ( let v = 0; v <= 1; v = v === 0 ? -1 : v === -1 ? 1 : 2 )
								{
									let found_intersection = false;

									both:
									for ( let i = 0; i < game.controlled_piece.length; i++ )
									{
										let a = game.controlled_piece[ i ];

										let dx = a.x - cx;
										let dy = a.y - cy;

										let x = cx - dy + u * game.block_size_safe;
										let y = cy + dx + v * game.block_size_safe;
										
										if ( x - a.radius < game.game_min_x )
										{
											found_intersection = true;
											break both;
										}
										
										if ( x + a.radius > game.game_max_x )
										{
											found_intersection = true;
											break both;
										}
										
										if ( y + a.radius > game.game_max_y )
										{
											found_intersection = true;
											break both;
										}

										const xx = ~~( x / Atom.hash_map_cell_size );
										const yy = ~~( y / Atom.hash_map_cell_size );

										if ( Atom.hash_map_2d_array[ xx ] )
										{
											let arr = Atom.hash_map_2d_array[ xx ][ yy ];

											if ( arr )
											{
												for ( let i = 0; i < arr.length; i++ )
												{
													let a2 = arr[ i ];

													if ( a2 !== a )
													if ( game.controlled_piece.indexOf( a2 ) === -1 )
													if ( game.Dist2D( a2.x, a2.y, x, y ) < a.radius + a2.radius )
													{
														found_intersection = true;
														break both;
													}
												}
											}
											else
											{
												found_intersection = true;
												break both;
											}
										}
										else
										{
											found_intersection = true;
											break both;
										}
									}

									if ( !found_intersection )
									{
										for ( let i = 0; i < game.controlled_piece.length; i++ )
										{
											let a = game.controlled_piece[ i ];

											let dx = a.x - cx;
											let dy = a.y - cy;

											a.x = cx - dy + u * game.block_size_safe;
											a.y = cy + dx + v * game.block_size_safe;
										}
										
										game.PlaySound( game.sound_spin );
								
										break three;
									}
								}
							}
						}
					}
					
					if ( game.controlled_piece )
					{
						//let max_vel = 0;
						
						let av_sy = 0;
						
						for ( let i = 0; i < game.controlled_piece.length; i++ )
						{
							let a = game.controlled_piece[ i ];
							if ( game.key_left || game.key_right || game.key_down )
							{
								a.sx += ( game.key_right - game.key_left ) * dt * 0.0004;
								a.sy += ( game.key_down ) * dt * 0.0006;
							}
								
							//let v = a.sx * a.sx + a.sy * a.sy;
							
							//if ( v > max_vel )
							//max_vel = v;
						
							av_sy += a.sy;
						}
						
						av_sy /= game.controlled_piece.length;
						
						if ( game.controlled_group_rest_timer < 0 )
						game.controlled_group_rest_timer = Math.min( 0, game.controlled_group_rest_timer + dt );
						else
						if ( av_sy <= 0 || game.controlled_group_rest_timer > 0 )
						{
							if ( game.key_left || game.key_right || game.key_down )
							game.controlled_group_rest_timer += dt * 0.25; // Some extra time if player holds left/right key
							else
							game.controlled_group_rest_timer += dt;
							
							if ( game.controlled_group_rest_timer > 1000 )
							{
								game.controlled_piece = null;
								game.score++;
							}
						}
						/*
						if ( max_vel > 0.02 )
						{
							game.controlled_group_rest_timer = 0;
						}
						else
						{
							game.controlled_group_rest_timer += dt;
							
							if ( game.controlled_group_rest_timer > 1500 )
							{
								game.controlled_piece = null;
							}
						}*/
					}

					Atom.Think( dt );

					for ( let i = 0; i < Chain.chains.length; i++ )
					if ( Chain.chains[ i ].Update( dt ) )
					{
						game.recalc_controlled_group = true;
						
						Chain.chains[ i ].remove();
						Chain.chains.splice( i, 1 );
						i--;
						continue;
					}
				}

				Face.Think( dt );
				
				if ( game.score_chimes_delay > game.score )
				game.score_chimes_delay = game.score;
				else
				game.score_chimes_delay = game.MorphWithTimeScale( game.score_chimes_delay, game.score, 0.99, dt, 0.1 );
				//game.score_chimes_delay = Math.min( game.score, game.score_chimes_delay + dt / 10 );//game.MorphWithTimeScale( game.score_chimes_delay, game.score, 0.995, dt, 1 );
			
				/*if ( game.score_visual_delay > game.score )
				game.score_visual_delay = game.score;
				else
				game.score_visual_delay = Math.min( game.score, game.score_visual_delay + dt / 100 );	
			*/
				let chimes_volume = Math.max( 0, Math.min( ( game.score - game.score_chimes_delay ) * 0.01, 1 ) * 0.1 );
				
				if ( !game.sounds )
				chimes_volume = 0;
				
				game.chimes.volume( chimes_volume * game.global_volume );
			}
			
			if ( game.frame_impact_volume > 0 )
			if ( game.sounds )
			{
				let id = game.sound_impact.play();
				game.sound_impact.volume( game.frame_impact_volume * game.global_volume, id );
				game.sound_impact.rate( 1.5, id );
			}
			
			game.will_render = true;
		}
		
		setTimeout( game.Think, 0 );
	}
	static onEnterFrame()
	{
		if ( game.will_render )
		{
			game.will_render = false;
			game.Render();
			
			let d = Date.now();
			game.frame_times.push( d );
			while ( game.frame_times[ 0 ] < d - 1000 )
			game.frame_times.shift();
		
			if ( d > game.frame_times_next_update )
			{
				game.frame_times_next_update = d + 250;
				game.frame_times_last = game.frame_times.length;
			}
		}
		
		requestAnimationFrame( game.onEnterFrame );
	}
}

game.init_class();