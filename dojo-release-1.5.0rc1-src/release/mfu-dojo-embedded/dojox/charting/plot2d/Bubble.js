/*
	Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojox.charting.plot2d.Bubble"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.charting.plot2d.Bubble"] = true;
dojo.provide("dojox.charting.plot2d.Bubble");

dojo.require("dojox.charting.plot2d.Base");
dojo.require("dojox.lang.functional");

(function(){
	var df = dojox.lang.functional, du = dojox.lang.utils,
		dc = dojox.charting.plot2d.common,
		purgeGroup = df.lambda("item.purgeGroup()");

	dojo.declare("dojox.charting.plot2d.Bubble", dojox.charting.plot2d.Base, {
		//	summary:
		//		A plot representing bubbles.  Note that data for Bubbles requires 3 parameters,
		//		in the form of:  { x, y, size }, where size determines the size of the bubble.
		defaultParams: {
			hAxis: "x",		// use a horizontal axis named "x"
			vAxis: "y",		// use a vertical axis named "y"
			animate: null   // animate bars into place
		},
		optionalParams: {
			// theme component
			stroke:		{},
			outline:	{},
			shadow:		{},
			fill:		{},
			font:		"",
			fontColor:	""
		},

		constructor: function(chart, kwArgs){
			//	summary:
			//		Create a plot of bubbles.
			//	chart: dojox.charting.Chart2D
			//		The chart this plot belongs to.
			//	kwArgs: dojox.charting.plot2d.__DefaultCtorArgs?
			//		Optional keyword arguments object to help define plot parameters.
			this.opt = dojo.clone(this.defaultParams);
			du.updateWithObject(this.opt, kwArgs);
			this.series = [];
			this.hAxis = this.opt.hAxis;
			this.vAxis = this.opt.vAxis;
			this.animate = this.opt.animate;
		},
		
		calculateAxes: function(dim){
			//	summary:
			//		Run the calculations for any axes for this plot.
			//	dim: Object
			//		An object in the form of { width, height }
			//	returns: dojox.charting.plot2d.Bubble
			//		A reference to this plot for functional chaining.
			this._calc(dim, dc.collectSimpleStats(this.series));
			return this;	//	dojox.charting.plot2d.Bubble
		},

		//	override the render so that we are plotting only circles.
		render: function(dim, offsets){
			//	summary:
			//		Run the calculations for any axes for this plot.
			//	dim: Object
			//		An object in the form of { width, height }
			//	offsets: Object
			//		An object of the form { l, r, t, b}.
			//	returns: dojox.charting.plot2d.Bubble
			//		A reference to this plot for functional chaining.
			if(this.zoom && !this.isDataDirty()){
				return this.performZoom(dim, offsets);
			}
			this.dirty = this.isDirty();
			if(this.dirty){
				dojo.forEach(this.series, purgeGroup);
				this.cleanGroup();
				var s = this.group;
				df.forEachRev(this.series, function(item){ item.cleanGroup(s); });
			}
		
			var t = this.chart.theme,
				ht = this._hScaler.scaler.getTransformerFromModel(this._hScaler),
				vt = this._vScaler.scaler.getTransformerFromModel(this._vScaler),
				events = this.events();

			this.resetEvents();

			for(var i = this.series.length - 1; i >= 0; --i){
				var run = this.series[i];
				if(!this.dirty && !run.dirty){
					t.skip();
					continue;
				}
				run.cleanGroup();
				if(!run.data.length){
					run.dirty = false;
					t.skip();
					continue;
				}

				if(typeof run.data[0] == "number"){
					console.warn("dojox.charting.plot2d.Bubble: the data in the following series cannot be rendered as a bubble chart; ", run);
					continue;
				}
				
				var theme = t.next("circle", [this.opt, run]), s = run.group,
					points = dojo.map(run.data, function(v, i){
						return v ? {
							x: ht(v.x) + offsets.l,
							y: dim.height - offsets.b - vt(v.y),
							radius: this._vScaler.bounds.scale * (v.size / 2)
						} : null;
					}, this);

				var frontCircles = null, outlineCircles = null, shadowCircles = null;

				// make shadows if needed
				if(theme.series.shadow){
					shadowCircles = dojo.map(points, function(item){
						if(item !== null){
							var finalTheme = t.addMixin(theme, "circle", item, true),
								shadow = finalTheme.series.shadow;
							var shape = s.createCircle({
								cx: item.x + shadow.dx, cy: item.y + shadow.dy, r: item.radius
							}).setStroke(shadow).setFill(shadow.color);
							if(this.animate){
								this._animateBubble(shape, dim.height - offsets.b, item.radius);
							}
							return shape;
						}
						return null;
					}, this);
					if(shadowCircles.length){
						run.dyn.shadow = shadowCircles[shadowCircles.length - 1].getStroke();
					}
				}

				// make outlines if needed
				if(theme.series.outline){
					outlineCircles = dojo.map(points, function(item){
						if(item !== null){
							var finalTheme = t.addMixin(theme, "circle", item, true),
								outline = dc.makeStroke(finalTheme.series.outline);
							outline.width = 2 * outline.width + theme.series.stroke.width;
							var shape = s.createCircle({
								cx: item.x, cy: item.y, r: item.radius
							}).setStroke(outline);
							if(this.animate){
								this._animateBubble(shape, dim.height - offsets.b, item.radius);
							}
							return shape;
						}
						return null;
					}, this);
					if(outlineCircles.length){
						run.dyn.outline = outlineCircles[outlineCircles.length - 1].getStroke();
					}
				}

				//	run through the data and add the circles.
				frontCircles = dojo.map(points, function(item){
					if(item !== null){
						var finalTheme = t.addMixin(theme, "circle", item, true),
							rect = {
								x: item.x - item.radius,
								y: item.y - item.radius,
								width:  2 * item.radius,
								height: 2 * item.radius
							};
						var specialFill = this._plotFill(finalTheme.series.fill, dim, offsets);
						specialFill = this._shapeFill(specialFill, rect);
						var shape = s.createCircle({
							cx: item.x, cy: item.y, r: item.radius
						}).setFill(specialFill).setStroke(finalTheme.series.stroke);
						if(this.animate){
							this._animateBubble(shape, dim.height - offsets.b, item.radius);
						}
						return shape;
					}
					return null;
				}, this);
				if(frontCircles.length){
					run.dyn.fill   = frontCircles[frontCircles.length - 1].getFill();
					run.dyn.stroke = frontCircles[frontCircles.length - 1].getStroke();
				}
				
				if(events){
					dojo.forEach(frontCircles, function(s, i){
						if(s !== null){
							var o = {
								element: "circle",
								index:   i,
								run:     run,
								plot:    this,
								hAxis:   this.hAxis || null,
								vAxis:   this.vAxis || null,
								shape:   s,
								outline: outlineCircles && outlineCircles[i] || null,
								shadow:  shadowCircles && shadowCircles[i] || null,
								x:       run.data[i].x,
								y:       run.data[i].y,
								r:       run.data[i].size / 2,
								cx:      points[i].x,
								cy:      points[i].y,
								cr:      points[i].radius
							};
							this._connectEvents(s, o);
						}
					}, this);
				}
				
				run.dirty = false;
			}
			this.dirty = false;
			return this;	//	dojox.charting.plot2d.Bubble
		},
		_animateBubble: function(shape, offset, size){
			dojox.gfx.fx.animateTransform(dojo.delegate({
				shape: shape,
				duration: 1200,
				transform: [
					{name: "translate", start: [0, offset], end: [0, 0]},
					{name: "scale", start: [0, 1/size], end: [1, 1]},
					{name: "original"}
				]
			}, this.animate)).play();
		}
	});
})();

}
