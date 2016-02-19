/*
	from mrbbp - eric@mrbbp.com
	badly coded at first to identify custom smart toys from Marbotic.fr
	adapted from my as3 lib
	https://github.com/mrbbp/wooden-smart-toy
	
	December 2015
	
	sorry for the code, not sure to understand exactly what difference between local properties and prototype properties...
*/

(function() {
	
	/* for ipadmini retina and 7" tablet (android)
	tested with :
	
				- Apple ipad mini retina (324 ppi)
				- Lenovo A7-40 (216 ppi)
				- Nexus 7 - first gen (216 ppi)
				
				
	to find value : screen dpi / 2.54 / (true screen width/ fake browser innerHTML size) (2 for iPad)
	
	for ipad AIR (retina) the value is 	: 51.93;
	for ipadmini (retina) the value is 	: 64.17 (default value used)
	
	*/
	var _1CMEcran; // = 64.17;
	var _1mm;
	
	// test//
	// utile plus loin
	function rotatePI(point, centerPoint){
		var baseX = point.x - centerPoint.x;
		var baseY = point.y - centerPoint.y;

		point.x = (Math.cos(Math.PI) * baseX) - (Math.sin(Math.PI) * baseY) + centerPoint.x;
		point.y = (Math.sin(Math.PI) * baseX) + (Math.cos(Math.PI) * baseY) + centerPoint.y;
	}

	// numero PieceCustom detectée
	var idPiece = 99;
	
	// valeur accessibles
	var ecartBasePX;
	var rhoPX;
	var theta;
	var ecartBaseMM;
	var rhoMM;
	var anglePiece;
	var anglePattern;
	
	var PatternInv	= false;
	var PieceInv 	= false;
	 
	var pB1 = new Point();
	var pB2 = new Point();
	var pS 	= new Point();

	// pour le dessin de la PieceCustom en mode debug - for drawing PieceCustom in debugMode
	var aCoulTrace = new Array("0xeeeeee", "0xaaaaaa", "0x666666", "0x222222");
		
	/**
	* PieceCustom instance - used to manage a Marbotic smartToy detection, etc.
	* @constructor
	* @function
	* @param {Point}  p0  - The first Touch
	* @param {Point}  p1  - The second Touch
	* @param {Point}  p2  - The third Touch
	* @param {Number} ref - number of pix / cm, by default 64.17 (for ipadmini retina) - have to change it to reflect your screen device
	* in a mobile browser, screen width (in landscape) is a fake screen size, generaly is 960px for Android, 1024px for iPad
	* @class
	* The PieceCustom object is populated with datas when detection is provided
	*/
	function Piece(p0, p1, p2, ref ){
		var p0 = new Point(p0.x,p0.y);
		var p1 = new Point(p1.x,p1.y);
		var p2 = new Point(p2.x,p2.y);
		//console.log(p0,p1,p2);
		
		/* 
			create the point in the middle of the 3 points
			used to know the place of the PieceCustom on the screen -> which player PieceCustom
		*/
		this.centrePiece = new Point( (p0.x+p1.x+p2.x)/3, (p0.y +p1.y +p2.y)/3 );
		
		_1CMEcran = ref || 64.17;
		_1mm = _1CMEcran/10;
		//console.log('ratio utilisé: '+_1CMEcran);
	
		// distances				
		var d0 = Math.floor(p0.distance(p1));
		var d1 = Math.floor(p1.distance(p2));
		var d2 = Math.floor(p2.distance(p0));
	
		if (d0 < d1) {
			if (d0 < d2) {
				// [d0] est le plus petit
				ecartBasePX = d0;
				pB1 = p0;
				pB2 = p1;
				pS = p2;
			} else {
				if (d2 < d1) {
					// [d2] est le plus petit
					ecartBasePX = d2;
					pB1 = p2;
					pB2 = p0;
					pS = p1;
				} else {
					// [d1] est le plus petit
					ecartBasePX = d1;
					pB1 = p1;
					pB2 = p2;
					pS = p0;
				}
			}
		} else {
			if (d2 < d1) {
				// [d2]
				ecartBasePX = d2;
				pB1 = p2;
				pB2 = p0;
				pS = p1;
			} else {
				// [d1]
				ecartBasePX = d1;
				pB1 = p1;
				pB2 = p2;
				pS = p0;
			}
		}
		
		// find Base midpoint
		pBCentre = pB1.interpolate(pB2, .5);
		
		//console.log(p0.toString(),p1.toString(),p2.toString())
	
		// if Sat Point is lower than base
		if (pS.y > pB1.y) {  
			// reverse it
			rotatePI(pB1, pBCentre);
			rotatePI(pB2, pBCentre);
			rotatePI(pS, pBCentre);
			PatternInv = true;
		} else {
			PatternInv = false;
		}
		
		// décale les points de la Base avec 0,0 du canvas comme origine pour le calcul en polaire
		if (pB1.x <= pB2.x) {
			// p1 Base Left Point, p2 Base Right Point
			pBaseG = new Point(pB1.x - pBCentre.x, (pB1.y - pBCentre.y) * 1);
			pBaseD = new Point(pB2.x - pBCentre.x, (pB2.y - pBCentre.y) * 1);
		} else {
			//p1 Base Right Point, p2 Base Left Point
			pBaseG = new Point(pB2.x - pBCentre.x, (pB2.y - pBCentre.y) * 1);
			pBaseD = new Point(pB1.x - pBCentre.x, (pB1.y - pBCentre.y) * 1);
		}
	
		// translate pSat point to new Origine
		pSat = new Point(pS.x - pBCentre.x, (pS.y - pBCentre.y) * 1);
		// move pCentre to 0,0
		pBCentre = new Point(0, 0);
		
		// tilt of the PieceCustom on the screen
		var angle = Math.atan2(pBaseD.y, pBaseD.x); // radians
		anglePiece = angle * (180/Math.PI);			// degres

		// rotate PieceCustom and straighten it
		var pBgTemp = new Point(Math.cos(-angle) * pBaseG.x - Math.sin(-angle) * pBaseG.y, Math.sin(-angle) * pBaseG.x + Math.cos(-angle) * pBaseG.y);
		var pBdTemp = new Point(Math.cos(-angle) * pBaseD.x - Math.sin(-angle) * pBaseD.y, Math.sin(-angle) * pBaseD.x + Math.cos(-angle) * pBaseD.y);
		var pSatTemp = new Point(Math.cos(-angle) * pSat.x - Math.sin(-angle) * pSat.y, Math.sin(-angle) * pSat.x + Math.cos(-angle) * pSat.y);
	
		// update Points coordinates
		pBaseG = new Point(pBgTemp.x, pBgTemp.y); // pour controle
		pBaseD = new Point(pBdTemp.x, pBdTemp.y); // pour controle
		// IMPORTANT
		pSat = new Point(pSatTemp.x, pSatTemp.y);

		// polar coordinates f the Satellite Point
		var pPSat = new Array(pBCentre.distance(pSat), pBCentre.degreesTo(pSat));
		
		// create public var result
		rhoPX = pPSat[0];
		// Distance in millimeters
		rhoMM = Math.round((pPSat[0]/_1mm)*10)/10;
		// Angle in Degres
		theta = Math.round(pPSat[1]*10)/10;
		// base gap
		ecartBaseMM = Math.round(ecartBasePX/_1mm);
		
		var thetaId, rhoMMId;
		var anglePattern;
		
		// Identify Custom PieceCustom and give good answer to PieceCustomInv and PatternInv
		// only for 18mm gap
		//	use rhoMM, theta to compare
		if(ecartBaseMM >= 16 && ecartBaseMM <= 20) {
			// custom pices with 18MM base size
			if (theta >=105 ) { // 3, 8, 13
				thetaId = 110;
			} else if (theta>95 && theta<105){ // 5, 10
				thetaId = 100;
			} else if (theta<=95 && theta>85) { //2, 7, 12
				thetaId = 90
			} else if (theta<=85 && theta>75) { // 2,7,12
				thetaId = 80;
			} else if(theta<=75) { // 1, 6, 11
				thetaId = 70;
			} else {
				console.log ("angle improper");
			}
			
			if (rhoMM >= 20 && rhoMM<26) {rhoMMId = 23;}
			else if (rhoMM >= 26 && rhoMM<33) {rhoMMId = 29;}
			else if (rhoMM >= 33 && rhoMM<38) {rhoMMId = 35;}
			else if (rhoMM >= 38 && rhoMM<44) {rhoMMId = 41;}
			else if (rhoMM >= 44 && rhoMM<50) {rhoMMId = 47;}
			else { console.log("rho improper");}
			
			switch (thetaId) {
				case 70:
					anglePattern = -20;
					if (rhoMMId == 23) { // 1
						idPiece = 1;
						(!PatternInv) ?PieceInv=false : PieceInv=true;
						PatternInv = false;
					}
					else if (rhoMMId == 47) { // 11
						idPiece = 11;
						(!PatternInv) ?PieceInv=false : PieceInv=true;
						PatternInv = false;
					}
					if (rhoMMId == 35) { // 6
						idPiece = 6;
						(!PatternInv) ?PieceInv=false : PieceInv=true;
						PatternInv = false;
					}
					break;
				case 80:
					anglePattern = -10;
					if (rhoMMId==29) { // 4
						idPiece = 4;
						(!PatternInv) ?PieceInv=false : PieceInv=true;
						PatternInv = false;
					}
					else if (rhoMMId == 41) { // 9
						idPiece = 9;
						(!PatternInv) ?PieceInv=false : PieceInv=true;
						PatternInv = false;
					}
					break;
				case 90:
					anglePattern = 0;
					if (rhoMMId==23) { // 2
						idPiece = 2;
						(!PatternInv) ?PieceInv=false : PieceInv=true;
						PatternInv = false;
					}
					else if (rhoMMId==47) { // 12
						idPiece = 12;
						(!PatternInv) ?PieceInv=false : PieceInv=true;
						PatternInv = false;
					}
					else if (rhoMMId==35) { // 7
						idPiece = 7;
						(!PatternInv) ?PieceInv=false : PieceInv=true;
						PatternInv = false;
					}
					break;
				case 100:
					anglePattern = 10;
					if (rhoMMId==35) { // 5
						idPiece = 5;
						(!PatternInv) ?PieceInv=false : PieceInv=true;
						PatternInv = false;
					}
					else { // 10
						idPiece = 10;
						(!PatternInv) ?PieceInv=false : PieceInv=true;
						PatternInv = false;
						
					}
					break;
				case 110:
					anglePattern = 20;
					if (rhoMMId == 23) { // 3
						idPiece = 3;
						(!PatternInv) ?PieceInv=false : PieceInv=true;
						PatternInv = false;
					}
					if (rhoMMId == 35) { // 8
						idPiece = 8;
						(!PatternInv) ?PieceInv=false : PieceInv=true;
						PatternInv = false;
					}
					if (rhoMMId == 47) { // 13
						idPiece = 13;
						(!PatternInv) ?PieceInv=false : PieceInv=true;
						PatternInv = false;
					}
					break;
				default:
					break;
			}
			
			
		} else {
			idPiece = "PieceCustom Unknown";
		}
		
		// fill PieceCustom object with usefull values
		Piece.prototype.rhoMM 		= rhoMM;
		Piece.prototype.theta 		= theta;
		Piece.prototype.idPiece 		= idPiece;
		Piece.prototype.PatternInv	= PatternInv;
		Piece.prototype.ecartBaseMM	= ecartBaseMM;
		Piece.prototype.ecartBasePX	= ecartBasePX;
		
		this.anglePiece 	= Math.round((anglePiece+anglePattern)*10)/10;
		this.PieceInv 		= PieceInv;
		this.anglePattern 	= anglePattern;
		
		// add points to draw a straightened footprint of the PieceCustom 
		Piece.prototype.baseG = new Point(Math.round(pBaseG.x), Math.round(pBaseG.y));
		Piece.prototype.baseD = new Point(Math.round(pBaseD.x), Math.round(pBaseD.y));
		Piece.prototype.sat   = new Point(Math.round(pSat.x), Math.round(pSat.y));
		Piece.prototype.centre= new Point(0,0);
	
	};
	
	/**
	* Returns the PieceCustom object expressed as a String value.
	* @function
	* @returns string
	*/
	Piece.prototype.toString = function(){
		return "idPiece= " + this.idPiece + ", rhoMM= " + this.rhoMM + ", theta= " + this.theta + ", Angle Pattern "+ this.anglePattern + ", ecartBaseMM= " + this.ecartBaseMM + ", ecartBasePX= " + this.ecartBasePX + ", anglePiece = " + this.anglePiece + ", pattern reversed= "+ this.PatternInv+ ", piece reversed="+ this.PieceInv;
	};
	
	/**
	* Returns the ID of the PieceCustom.
	* @function
	* @param none.
	* @returns number
	*/
	Piece.prototype.id = function(){
		return idPiece;		
	};
	
	return this.Piece = window.Piece = Piece;
	
})()	