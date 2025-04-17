
/* global game */

class Face
{
	static init_class()
	{
		Face.faces = [];
	}
	
	constructor( params )
	{
		this.eyes = [ params.left, params.right ];
		
		this.mouth = params.mouth;
		
		this.look_x = params.left.x;
		this.look_y = params.left.y;
		
		this.look_x_slow = params.right.x;
		this.look_y_slow = params.right.y;
		
		this.relook_timer = 0;
		
		this.blink_timer = 0;
		
		this.scale_x = 1;
		this.scale_y = 1;
		
		this.scale_tx = 1;
		this.scale_ty = 1;
		
		this.scale_sx = 0;
		this.scale_sy = 0;
		
		this.mouth_opennes = 0;
		this.mouth_opennes_target = 0;
	}
	
	static Think( dt )
	{
		const eye_morph_prepared = game.MorphWithTimeScale_prepare( 0.99, dt );
		const velocity_decrease_prepared = game.MorphWithTimeScale_prepare( 0.9, dt );
		
		for ( let i = 0; i < Face.faces.length; i++ )
		if ( Face.faces[ i ].Update( dt, eye_morph_prepared, velocity_decrease_prepared ) )
		{
			Face.faces[ i ].remove();
			Face.faces.splice( i, 1 );
			i--;
			continue;
		}
	}
	Update( dt, eye_morph_prepared, velocity_decrease_prepared )
	{
		this.relook_timer -= dt;
		
		this.blink_timer -= dt;
		
		this.scale_sx = game.MorphWithTimeScale_do( this.scale_sx, 0, velocity_decrease_prepared );
		this.scale_sy = game.MorphWithTimeScale_do( this.scale_sy, 0, velocity_decrease_prepared );
		
		this.scale_x += this.scale_sx * dt;
		this.scale_y += this.scale_sy * dt;
		
		this.scale_sx += ( this.scale_tx - this.scale_x ) * dt * 0.01;
		this.scale_sy += ( this.scale_ty - this.scale_y ) * dt * 0.01;
		
		if ( this.scale_y < 0 )
		this.scale_y = 0;
		
		if ( this.scale_x < 0 )
		this.scale_x = 0;
		
		if ( this.blink_timer < 0 )
		{
			this.scale_tx = 2;
			this.scale_ty = 0;
		}
		else
		{
			this.scale_tx = 1;
			this.scale_ty = 1;
		}
		
		if ( this.blink_timer < -80 )
		{
			this.blink_timer = 3000 + Math.random() * 2000;
			this.mouth_opennes_target = ( Math.random() < 0.5 ) ? 0 : 1;
		}
		
		if ( this.relook_timer < 0 )
		{
			this.relook_timer = 500 + Math.random() * 1000;
			
			this.look_x = Math.random() * 800 - 400 + this.eyes[ 0 ].x;
			this.look_y = Math.random() * 800 - 400 + this.eyes[ 0 ].y;
		}
		
		this.look_x_slow = game.MorphWithTimeScale_do( this.look_x_slow, this.look_x, eye_morph_prepared );
		this.look_y_slow = game.MorphWithTimeScale_do( this.look_y_slow, this.look_y, eye_morph_prepared );
		
		if ( this.mouth_opennes < this.mouth_opennes_target )
		this.mouth_opennes = Math.min( this.mouth_opennes + dt * 0.01, this.mouth_opennes_target );
		else
		this.mouth_opennes = Math.max( this.mouth_opennes - dt * 0.01, this.mouth_opennes_target );
		
		if ( this.eyes[ 0 ].nuked && this.eyes[ 1 ].nuked && this.mouth.nuked )
		return true;
		
		return false;
	}
	
	remove()
	{
	}
}
Face.init_class();