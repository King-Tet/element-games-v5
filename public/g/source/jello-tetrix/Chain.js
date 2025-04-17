
/* global game */

class Chain
{
	static init_class()
	{
		Chain.chains = [];
	}
	
	
	constructor( params )
	{
		this.p = params.p;
		this.c = params.c;
		
		if ( this.p === this.c )
		throw new Error();
		
		this.p.chains.push( this );
		this.c.chains.push( this );
		
		this.color = params.color || null;
		
		this.def = params.def || game.Dist2D( this.p.x, this.p.y, this.c.x, this.c.y );
		
		this.break_delta = params.break_delta || 5;
		
		this.strength = params.strength || 0.001;
		
		this.nuked = false; // Delayed removal
		
		Chain.chains.push( this );
	}
	
	static Push( p, c, def, strength, dt )//, is_collision=false )
	{
		//strength *= 0.35;
		
		//const stop_factor = 5; // 15 // 30
		const stop_factor = 2; // 15 // 30
			
		let di = game.Dist2D( p.x + p.sx * stop_factor, p.y + p.sy * stop_factor, c.x + c.sx * stop_factor, c.y + c.sy * stop_factor );
		
		/*if ( is_collision )
		{
			if ( di >= def )
			return;
		}*/
		
		if ( di > 0.000001 )
		{
			//let dx = ( c.x - p.x ) / di * ( def - di ) * dt * strength;
			//let dy = ( c.y - p.y ) / di * ( def - di ) * dt * strength;
			
			let dx = ( c.x + c.sx * stop_factor - p.x - p.sx * stop_factor ) / di * ( def - di ) * dt * strength;
			let dy = ( c.y + c.sy * stop_factor - p.y - p.sy * stop_factor ) / di * ( def - di ) * dt * strength;
			
			if ( p.mass === c.mass )
			{
				c.fx += dx;
				p.fx -= dx;

				c.fy += dy;
				p.fy -= dy;
				
				/*p.idle = false;
				c.idle = false;*/
			}
			else
			{
				const mass_sum = p.mass + c.mass;
				
				const p_strength = c.mass / mass_sum;
				const c_strength = mass_sum - p_strength;

				c.fx += dx * c_strength;
				p.fx -= dx * p_strength;

				c.fy += dy * c_strength;
				p.fy -= dy * p_strength;
				
				/*if ( p_strength > 0 )
				p.idle = false;
				if ( c_strength > 0 )
				c.idle = false;*/
			}
			
			
			/*
			if ( isNaN( c.sx ) )
			debugger;
			if ( isNaN( p.sx ) )
			debugger;*/
		}
	}
	
	Update( dt )
	{
		if ( this.nuked )
		return true; // Delete
	
		let di = game.Dist2D( this.p.x, this.p.y, this.c.x, this.c.y );
		
		if ( di > this.def + this.break_delta || di < this.def - this.break_delta )
		return true; // Delete
	
		Chain.Push( this.p, this.c, this.def, this.strength, dt );
	
		return false; // Keep
	}
	
	remove()
	{
		this.nuked = true;
	}
}

Chain.init_class();