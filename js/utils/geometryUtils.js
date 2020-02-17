geometryUtils={
	XOR: function(a,b) {
  		return ( a || b ) && !( a && b );
	},
	globalPointInRegion: function(x,y,region) {
		var polyCorners=region.len;
		var i, j=polyCorners-1; 
	    var oddNodes=false;
	    var points=region.globalPoints;

	  	for (i=0; i<polyCorners; i++) {
	    	if ((points[i].y< y && points[j].y>=y || points[j].y< y && points[i].y>=y) &&  (points[i].x<=x || points[j].x<=x)) {
	       		oddNodes =geometryUtils.XOR(oddNodes, (points[i].x+(y-points[i].y)/(points[j].y-points[i].y)*(points[j].x-points[i].x)<x) ) 
	       	}
	    	j=i; 
		}

	  return oddNodes; 
	},
	viewerPointInRegion: function(x,y,region) {
		var polyCorners=region.len;
		var i, j=polyCorners-1; 
	    var oddNodes=false;
	    var points=region.points;

	  	for (i=0; i<polyCorners; i++) {
	    	if ((points[i].y< y && points[j].y>=y || points[j].y< y && points[i].y>=y) &&  (points[i].x<=x || points[j].x<=x)) {
	       		oddNodes =geometryUtils.XOR(oddNodes, (points[i].x+(y-points[i].y)/(points[j].y-points[i].y)*(points[j].x-points[i].x)<x) ) 
	       	}
	    	j=i; 
		}

	  return oddNodes; 
	}

	
}