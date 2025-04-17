
/* global Chain, game */

class Atom
{
	static init_class()
	{
		Atom.atoms = [];
		
		Atom.quad_group_counter = 0;
		
		Atom.max_atom_radius = 5; // 5
		Atom.hash_map_cell_size = Atom.max_atom_radius * 2;
		
		//Atom.hash_map = new Map();
		Atom.hash_map_2d_array = [];
		for ( let x = 0; x < game.screen_width / Atom.hash_map_cell_size; x += 1 )
		{
			Atom.hash_map_2d_array[ x ] = [];
			
			for ( let y = 0; y < game.screen_height / Atom.hash_map_cell_size; y += 1 )
			Atom.hash_map_2d_array[ x ][ y ] = [];
		}
		
		Atom.canvas_cache = new Map(); // Circles by color?
	}
	
	/*static XYToHash( x, y )
	{
		return Math.floor( x / Atom.hash_map_cell_size ) * 1000 + Math.floor( y / Atom.hash_map_cell_size );
	}
	*/
	constructor( params )
	{
		this.x = params.x || 0;
		this.y = params.y || 0;
		
		this.sx = params.sx || 0;
		this.sy = params.sy || 0;
		
		// New values, applied only after atom logic
		this.fx = 0;
		this.fy = 0;
		
		this.mass = params.mass || 1;
		
		this.radius = params.radius || 5;
		
		this.broken_out = false; // Removed at the bottom
		
		this.nuked = false;
		
		this.quad_group = params.quad_group || 0;
		
		//this.idle = true;
		
		if ( this.radius > Atom.max_atom_radius )
		throw new Error();
		
		this.color = params.color || '#ffffff';
		
		this.chains = [];
		
		//this.hash = null;
		this.hash_array = null;
		
		this.UpdateHash();
		
		Atom.atoms.push( this );
	}
	BreakOut()
	{
		this.broken_out = true;
		
		/*for ( let i = 0; i < this.chains.length; i++ )
		this.chains[ i ].nuked = true;
	
		this.chains.length = 0;*/
		
		//this.color = '#ffffff';
		
		//this.sx += ( Math.random() - 0.5 ) * 0.5;
		//this.sy += ( Math.random() - 0.5 ) * 0.5;
		
		let an = Math.random() * Math.PI * 2;
		
		let v = 1;// + Math.random() * 0.5;
		
		this.sx += Math.sin( an ) * v;
		this.sy += Math.cos( an ) * v;
		
		//this.sx -= 2;
	}
	DeleteFromHash()
	{
		let old_array = this.hash_array;
				
		if ( old_array.length === 1 )
		{
			if ( old_array[ 0 ] !== this )
			throw new Error();

			//Atom.hash_map.delete( this.hash );
			old_array.pop();
		}
		else
		{
			let id = old_array.indexOf( this );

			if ( id === -1 )
			throw new Error();

			old_array.splice( id, 1 );
		}
		
		/*let old_array = Atom.hash_map.get( this.hash );
				
		if ( old_array.length === 1 )
		{
			if ( old_array[ 0 ] !== this )
			throw new Error();

			Atom.hash_map.delete( this.hash );
		}
		else
		{
			let id = old_array.indexOf( this );

			if ( id === -1 )
			throw new Error();

			old_array.splice( id, 1 );
		}*/
	}
	UpdateHash()
	{
		//let new_hash = Atom.XYToHash( this.x, this.y );
		
		let xx = ~~( this.x / Atom.hash_map_cell_size );
		let yy = ~~( this.y / Atom.hash_map_cell_size );
		
		if ( xx >= 0 && xx < Atom.hash_map_2d_array.length &&
			 yy >= 0 && yy < Atom.hash_map_2d_array[ xx ].length )
		{
		}
		else
		return;
	
		let new_array = Atom.hash_map_2d_array[ xx ][ yy ];

		//if ( this.hash !== new_hash )
		if ( this.hash_array !== new_array )
		{
			//if ( this.hash === null )
			if ( this.hash_array === null )
			{
			}
			else
			{
				this.DeleteFromHash();
			}
			
			//this.hash = new_hash;
			
			//let new_array = Atom.hash_map.get( new_hash );
			
			/*if ( new_array === undefined )
			{
				new_array = [ this ];
				Atom.hash_map.set( new_hash, new_array );
			}
			else*/
			{
				new_array.push( this );
			}
			this.hash_array = new_array;
		}
	}
	
	SolelyAtomAtomCollisionLogic( dt, collision_friction_prepared )
	{			
		const minx = this.x - this.radius;
		const maxx = this.x + this.radius;
		const miny = this.y - this.radius;
		const maxy = this.y + this.radius;

		const hash_map_cell_size = Atom.hash_map_cell_size;
		
		const xx = ~~( this.x / Atom.hash_map_cell_size );
		const yy = ~~( this.y / Atom.hash_map_cell_size );
		
		const x_min = ( xx === 0 ) ? 0 : -1;
		const x_max = ( xx === Atom.hash_map_2d_array.length - 1 ) ? 0 : 1;
		
		const y_min = ( yy === 0 ) ? 0 : -1;
		const y_max = ( yy === Atom.hash_map_2d_array[ 0 ].length - 1 ) ? 0 : 1;
		
		if ( xx < 0 )
		return;
		
		if ( xx >= Atom.hash_map_2d_array.length )
		return;
		
		if ( yy >= Atom.hash_map_2d_array[ 0 ].length )
		return;
	
		if ( yy < 0 )
		return;

		//for ( let x = -1; x <= 1; x++ )
		//if ( xx + x >= 0 && xx + x < Atom.hash_map_2d_array.length )
		for ( let x = x_min; x <= x_max; x++ )
		{
			const xx_hash_array = Atom.hash_map_2d_array[ xx + x ];
			
			for ( let y = y_min; y <= y_max; y++ )
			//if ( yy + y >= 0 && yy + y < Atom.hash_map_2d_array[ xx + x ].length )
			{
				/*const hash_array = Atom.hash_map.get( 
						Atom.XYToHash( this.x + x*hash_map_cell_size, this.y + y*hash_map_cell_size ) 
				);*/

				const hash_array = xx_hash_array[ yy + y ];

				//if ( hash_array )
				for ( let i = 0; i < hash_array.length; i++ )
				{
					const a = hash_array[ i ];

					if ( a.x - a.radius < maxx )
					if ( a.x + a.radius > minx )
					if ( a.y - a.radius < maxy )
					if ( a.y + a.radius > miny )
					if ( a !== this )
					//if ( !a.broken_out )
					if ( a.broken_out === this.broken_out )
					{
						const di = game.Dist2D( this.x, this.y, a.x, a.y );

						if ( di < this.radius + a.radius )
						{
							let av_sx = ( this.sx + a.sx ) / 2;
							let av_sy = ( this.sy + a.sy ) / 2;

							//this.sx = game.MorphWithTimeScale_do( this.sx, av_sx, collision_friction_prepared );
							//this.sy = game.MorphWithTimeScale_do( this.sy, av_sy, collision_friction_prepared );

							this.fx += game.MorphWithTimeScale_do( this.sx, av_sx, collision_friction_prepared ) - this.sx;
							this.fy += game.MorphWithTimeScale_do( this.sy, av_sy, collision_friction_prepared ) - this.sy;

							//this.sx = game.MorphWithTimeScale( this.sx, av_sx, 0.99, dt );
							//this.sy = game.MorphWithTimeScale( this.sy, av_sy, 0.99, dt );

							Chain.Push( this, a, this.radius + a.radius, 0.01, dt );
							//Chain.Push( this, a, this.radius + a.radius, 0.005, dt );
							
							let av_sx2 = ( this.sx + a.sx ) / 2;
							let av_sy2 = ( this.sy + a.sy ) / 2;
							
							let delta_velocity = game.Dist2D( av_sx, av_sy, av_sx2, av_sy2 );
			
							game.PlayImpactSound( delta_velocity, this.mass + a.mass );
							
							/*if ( di < ( this.radius + a.radius ) * 0.9 ) // Sticking to each other
							{
								const chains = this.chains;
								
								let merge = true;
								
								for ( let i = 0; i < chains.length; i++ )
								if ( chains[ i ].p === a || chains[ i ].c === a )
								{
									merge = false;
									break;
								}
								
								if ( merge )
								{
									new Chain({
										p: this,
										c: a,
										def: this.radius + a.radius,
										break_delta: 2,
										strength: 0.002
									});
								}
							}*/
						}
					}
				}
			}
		}
	}
	
	static Think( dt )
	{
		const air_friction_prepared = game.MorphWithTimeScale_prepare( 0.999, dt );
		
		for ( let i = 0; i < Atom.atoms.length; i++ )
		if ( Atom.atoms[ i ].Update( dt, air_friction_prepared ) )
		{
			Atom.atoms[ i ].remove();
			Atom.atoms.splice( i, 1 );
			i--;
			continue;
		}
				
		const collision_friction_prepared = game.MorphWithTimeScale_prepare( 0.99, dt );
		
		for ( let i = 0; i < Atom.atoms.length; i++ )
		//if ( !Atom.atoms[ i ].broken_out )
		Atom.atoms[ i ].SolelyAtomAtomCollisionLogic( dt, collision_friction_prepared );
	}
	Update( dt, air_friction_prepared )
	{
		this.sx += this.fx;
		this.sy += this.fy;
		
		this.fx = 0;
		this.fy = 0;
		
		//
		
		this.x += this.sx * dt;
		this.y += this.sy * dt;

		this.fy += dt * 0.0002;
		
		if ( this.broken_out )
		{
		}
		else
		{
			//this.sx = game.MorphWithTimeScale_do( this.sx, 0, air_friction_prepared );
			//this.sy = game.MorphWithTimeScale_do( this.sy, 0, air_friction_prepared );
			this.fx += game.MorphWithTimeScale_do( this.sx, 0, air_friction_prepared ) - this.sx;
			this.fy += game.MorphWithTimeScale_do( this.sy, 0, air_friction_prepared ) - this.sy;
		}

		this.UpdateHash();
		
		this.WallCollision( 'y', 0, 1 );

		if ( this.broken_out )
		{
			this.WallCollision( 'x', 0, 1 );
			this.WallCollision( 'x', game.screen_width, -1 );

			if ( this.y > game.screen_height + 20 )
			return true; // Delete
		}
		else
		{
			this.WallCollision( 'x', game.game_min_x, 1 );
			this.WallCollision( 'x', game.game_max_x, -1 );
			this.WallCollision( 'y', game.game_max_y, -1 );
		}

	
		return false; // Keep
	}
	
	WallCollision( POS_PROP, wall_pos, sign )
	{
		const VEL_PROP = 's' + POS_PROP;
		
		const POS_PROP_PERP = ( POS_PROP === 'x' ) ? 'y' : 'x';
		
		const VEL_PROP_PERP = 's' + POS_PROP_PERP;

		//if ( this[ POS_PROP ] + this.radius * ( -sign ) > wall_pos )
		if ( ( this[ POS_PROP ] + this.radius * ( -sign ) ) * ( -sign ) > wall_pos * ( -sign ) )
		{
			const friction = Math.max( 0, this[ VEL_PROP ] * 0.7 * ( -sign ) );
			if ( this[ VEL_PROP_PERP ] > 0 )
			{
				if ( this[ VEL_PROP_PERP ] < friction )
				this[ VEL_PROP_PERP ] = 0;
				else
				this[ VEL_PROP_PERP ] -= friction;
			}
			else
			{
				if ( this[ VEL_PROP_PERP ] > -friction )
				this[ VEL_PROP_PERP ] = 0;
				else
				this[ VEL_PROP_PERP ] += friction;
			}
			
			let old_vel = this[ VEL_PROP ];
			
			this[ VEL_PROP ] = Math.abs( this[ VEL_PROP ] ) * 0.5 * sign;
			this[ POS_PROP ] = wall_pos + this.radius * sign;
			
			
			game.PlayImpactSound( Math.abs( this[ VEL_PROP ] - old_vel ), this.mass );
		}

		/*if ( this.y + this.radius > game.screen_height )
		{
			const friction = Math.max( 0, this.sy * 0.7 );
			if ( this.sx > 0 )
			{
				if ( this.sx < friction )
				this.sx = 0;
				else
				this.sx -= friction;
			}
			else
			{
				if ( this.sx > -friction )
				this.sx = 0;
				else
				this.sx += friction;
			}
			this.sy = -Math.abs( this.sy ) * 0.5;
			this.y = game.screen_height - this.radius;
		}*/
	}
	
	remove()
	{
		for ( let i = 0; i < this.chains.length; i++ )
		this.chains[ i ].nuked = true;
	
		this.chains.length = 0;
		
		this.DeleteFromHash();
		
		this.nuked = true;
	}
}
Atom.init_class();