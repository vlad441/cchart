// Custom Chart v0.1.0
/* опции: absolute-абс.шкала, legend-отметки, simple-без интерактива,setka-сетка,clumns-колонки,delta(min/max)val-разница макс/мин,color-цвет линии. cname: Название графика
		, names-имена координат*/
let cchart={}; cchart.create = function(divid, size=[500,170]){
	let chart={dobj: document.getElementById(divid), canvas: document.createElement("canvas"), points:[], ischmdiv:false, options:{}};
	chart.canvas.style="width:"+size[0]+";height:"+size[1]+";border:1px solid black;vertical-align:top;display:inline-block;";

	chart.draw=function(arrcd)
	{	dobj = this.dobj; options=this.options; document.getElementById(this.divid); dobj.innerHTML=""; let canvas = this.canvas;
		let ldiv = document.createElement("div"); dobj.appendChild(ldiv); dobj.appendChild(canvas);
    if(options.cname){ dobj.innerHTML="<div style:\"display:block;\">"+options.cname+"</div>"; } dobj.appendChild(canvas);
		let cwidth = parseInt(getComputedStyle(canvas).width), cheight=parseInt(getComputedStyle(canvas).height); let drheight=Math.floor(cheight*0.97), drwidth=Math.floor(cwidth*0.97);
		canvas.width=cwidth; canvas.height=cheight; let xydiv=[];
		let ctx = canvas.getContext("2d"); ctx.font = '14pt Calibri'; ctx.transform(1, 0, 0, -1, 0, canvas.height);
		let maxval=[0,0]; let minval=[0,0]; let isLegStr=false; let tmpval; // == search maxvals ==
		for(let key in arrcd){
			for(let i in maxval){ tmpval=arrcd[key][i]; if(isNaN(Number(tmpval))){ isLegStr=true; tmpval=Number(key); } if(tmpval>maxval[i]){ maxval[i]=tmpval; } } }
		if(true){ minval[0]=maxval[0]; minval[1]=maxval[1]; for(let key in arrcd){
				for(let i in minval){ tmpval=arrcd[key][i]; if(isNaN(Number(tmpval))){ tmpval=Number(key); } if(tmpval<minval[i]){ minval[i]=tmpval; } } } }
		if(options.absolute){ if(maxval[0]>maxval[1]){ maxval[1]=maxval[0]; }else{ maxval[0]=maxval[1]; } if(minval[0]>=0&&minval[1]>=0){ minval=[0,0]; }
			else{ if(minval[0]<minval[1]){ minval[1]=minval[0]; }else{ minval[0]=minval[1]; } for(let i in minval){ if(Math.abs(minval[i])>maxval[i]){ maxval[i]=Math.abs(minval[i]); } } } }
		// == vals delta ==
		if(options.deltaminval){ minval[0]+=options.deltaminval[0]; minval[1]+=options.deltaminval[1]; }
		if(options.deltamaxval){ maxval[0]+=options.deltamaxval[0]; maxval[1]+=options.deltamaxval[1]; }
		let deltaval=[maxval[0]-minval[0], maxval[1]-minval[1]],deltacalc=[deltaval[0], deltaval[1]]; for(let i in deltacalc){ if(deltacalc[i]<=0){ deltacalc[i]=1; } }
		// == заполнение легенд ==
		let columns=8; if(options.columns){ columns=options.columns; }
		if(options.legend!==false){ let span, spos=0;
			xydiv[0]=document.createElement("div"); xydiv[1]=document.createElement("div");
			xydiv[0].style="width:"+cwidth+"px;height:20px;position:relative;";
			xydiv[1].style="width:50px;height:"+cheight+"px;display:inline-block;vertical-align:top;position:relative;";
			dobj.appendChild(xydiv[1]);
			dobj.appendChild(xydiv[0]); let tofix=[0,0];
			for(let i in deltaval){
				if(deltaval[i]>=0){ if(deltaval[i]/(columns-1)<1){ tofix[i]=2; } if(deltaval[i]/(columns-1)<0.01){ tofix[i]=3; }if(deltaval[i]/(columns-1)<0.001){ tofix[i]=4; } } }
			if(isLegStr){ columns=arrcd.length; if(columns<2){ columns=2; } }
			for(let i=0;i<columns;i++){ spos=(drheight/(columns-1)*i).toFixed(2);
				span=document.createElement("span"); span.style="position:absolute;left:2px;bottom:"+(spos-10); //Math.ceil(cwidth*0.045)
				span.innerHTML=(minval[1]+(deltaval[1])*(spos/drheight)).toFixed(tofix[1]); xydiv[1].appendChild(span);
				if(options.setka){ ctx.strokeStyle="gray"; ctx.beginPath(); ctx.moveTo(0, spos); ctx.lineTo(cwidth, spos); ctx.stroke(); }
				// == x ==
				spos=(drwidth/(columns-1)*i).toFixed(2); span=document.createElement("span"); span.style="position:absolute;top:4px; left:"+spos+"px;";
				if(isLegStr){ if(arrcd[i]){tmpval=arrcd[i][0];}else{tmpval="End";}span.innerHTML=tmpval;}else{ span.innerHTML=(minval[0]+(deltaval[0])*(spos/drwidth)).toFixed(tofix[0]); }
				xydiv[0].appendChild(span);
				if(options.setka){ ctx.strokeStyle="gray"; ctx.beginPath(); ctx.moveTo(spos, 0); ctx.lineTo(spos, cheight); ctx.stroke(); }
			}
		}
		// == отрисовка ==
		if(options.color){ ctx.strokeStyle=options.color; ctx.fillStyle=options.color; }else{ ctx.strokeStyle="blue"; }
		ctx.beginPath(); this.points=[]; let tmpcord=[0,0];
		for(let key in arrcd){ if(isLegStr){ arrcd[key][0]=Number(key); } tmpcord[0]=Math.floor(drwidth*((arrcd[key][0]-minval[0])/(deltacalc[0])));
			tmpcord[1]=Math.floor(drheight*((arrcd[key][1]-minval[1])/(deltacalc[1])));
			if(deltaval[1]<=0){ tmpcord[1]=Math.floor(drheight/2); } if(!options.simple){ this.points.push([tmpcord[0], tmpcord[1], arrcd[key][0], arrcd[key][1]]); }
			ctx.lineTo(tmpcord[0], tmpcord[1]); ctx.arc(tmpcord[0], tmpcord[1], 3, 0, 2*Math.PI); ctx.moveTo(tmpcord[0], tmpcord[1]);
		} ctx.stroke();
		// == интерактив ==
		if(!options.simple){ let cpoints = this.points; let names=["x","y"]; if(options.names){ names=options.names; }
			canvas.onmousemove=function(mobj){ let rect=canvas.getBoundingClientRect(); let m={x:mobj.clientX-rect.left, y:cheight-(mobj.clientY-rect.top)+1};
			let isdist=false; for(let key in cpoints){
				if(cchart.pifagor2(m.x, m.y, cpoints[key][0], cpoints[key][1])<4)
				{ if(!chart.ischmdiv){ OpenChartModal([cpoints[key][0]+rect.left+6,cheight-(cpoints[key][1]-rect.top+10)],
				  {x:[names[0],cpoints[key][2]],y:[names[1],cpoints[key][3]]}); chart.ischmdiv=true; } isdist=true; break; }
			} if(!isdist){ CloseChartModal(); chart.ischmdiv=false; } }; }
	}

	chart.calcfunc = function(func, limit=10, step=1, options, start=0)
	{  let funcres=[]; let x=start; for(let i=0;i<limit;i++){ funcres.push([x,eval(func)]); x+=step; } this.draw(funcres,options); }
	chart.randomizer = function(limit=10,options)
	{ let cords=[]; for(let i=0;i<limit;i++){ cords.push([i,Math.random()]); } this.draw(cords,options); }

	return chart;
};

cchart.pifagor2 = function(x1, y1 , x2, y2){ return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2)); }

function OpenChartModal(position, data)
{   let chmdiv = document.getElementById("div-modal-chart"); if(chmdiv==null){ chmdiv = document.createElement("div"); chmdiv.id="div-modal-chart"; document.body.appendChild(chmdiv); }
    chmdiv.innerHTML="<button onclick=\"CloseChartModal()\" style=\"float:right;border:0px;background:none;color:#ffd700;font-size:10px;right:1px;position:absolute;\">X</button><br>";
	chmdiv.style="border:3px solid #ffd700; border-radius: 5px; background: #FFFFFF; margin: auto; position: fixed; top:"+position[1]+"px;left:"+position[0]+"px;";
    chmdiv.innerHTML+=data.y[0]+":"+data.y[1]+"<br>"+data.x[0]+":"+data.x[1];
}

function CloseChartModal()
{ let chmdiv = document.getElementById("div-modal-chart"); if(chmdiv==null){ return; }
  chmdiv.innerHTML = ""; chmdiv.style="opacity:0;visibility:hidden;"; }
