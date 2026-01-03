// Custom Chart v0.2.0
class CustomChart { static version = "v0.2.0";
    constructor(divid, size = [500, 170], options={}){
        this.container = document.getElementById(divid);
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
      
        this.width = size[0]; this.height = size[1];
        this.options = options; this.ischmdiv = false; // Состояние тултипа
        this._initCanvas(); }

    _initCanvas(){ this.canvas.width = this.width; this.canvas.height = this.height;
        this.canvas.style.cssText = `width:${this.width}px; height:${this.height}px; border:1px solid black; vertical-align:top; display:inline-block;`;
        this.container.style.position = "relative"; }
		
	clear(){ this.ctx.clearRect(0, 0, this.width, this.height); }

    draw(dataSets=[], opts={}){ this.clear(); this.container.innerHTML = ""; dataSets = this.constructor._normData(dataSets); this.dataSets = dataSets;
        this.bounds = this._calcBounds(); // 2. Расчет границ
        this._renderLayout(); // 3. Подготовка слоев (Заголовок и легенды)
        this._renderData(); // 4. Отрисовка данных
        if(!this.options.simple){ this._initEvents(); }else{ this._clearEvents(); } // 5. Интерактив
		delete this.dataSets; }
		
	static _normSet(dset=[]){ if(typeof(dset[0]) === 'number'){ return [dset.map((v, i) => [i, v])]; } return dset; }
	static _normData(data=[]){ if(Array.isArray(data[0]) && Array.isArray(data[0][0])){ return data; } // Случай 4: N полных сетов [[[0,0],...], [...]]
		else if(typeof(data[0]) === 'number'){ return [data.map((v, i) => [i, v])]; } //Случай 1: 1 неполный сет [0,2,8]
		else{ return CustomChart.format(data); } } // В иных случаях отдаем на эвристику.
	
	static format(data=[]){ if(data.length === 0) return [];
		if(!Array.isArray(data[0])){ return [data.map((v, i) => [i, v])]; } //Случай 1: 1 неполный сет [0,2,8]
		if(Array.isArray(data[0]) && !Array.isArray(data[0][0])){
			const looksLikePoint = data[0].length === 2 && typeof data[0][1] === 'number';
			// Случай 2: 1 полный сет [[0,0], [1,2], [2,8]]
			if(looksLikePoint){ return [data]; }
			else{ return data.map(set => set.map((v, i) => [i, v])); } // Случай 3: N неполных сетов [[0,2,8], [...]]
		} return data; } // Случай 4: N полных сетов [[[0,0],...], [...]]

    _calcBounds(){ const { options, dataSets } = this; let maxval = [0, 0]; let minval = [0, 0]; let isLegStr = false;
        // Поиск максимумов и определение, есть ли строки (isLegStr)
        for(let dataSet of dataSets){
            for(let pn in dataSet){ let point = dataSet[pn];
                for(let i in point){ let tval = point[i];
                    if(isNaN(Number(tval))){ isLegStr = true; tval = Number(pn); }
                    if(tval > maxval[i]) maxval[i] = tval; } } } minval = [...maxval];
        // Поиск минимумов
        for(let dataSet of dataSets){
            for(let pn in dataSet){ let point = dataSet[pn];
                for(let i in point){ let tval = point[i];
                    if(isNaN(Number(tval))){ isLegStr = true; tval = Number(pn); }
					if(tval < minval[i]) minval[i] = tval; } } }

        // Логика absolute
        if(options.absolute){
            maxval[0] = maxval[1] = Math.max(maxval[0], maxval[1]);
            if(minval[0] >= 0 && minval[1] >= 0){ minval = [0, 0]; }
			else{ minval[0] = minval[1] = Math.min(minval[0], minval[1]);
                for(let i in minval) maxval[i] = Math.max(maxval[i], Math.abs(minval[i])); }
        }
        // Дельты
        if(options.deltaminval){ minval[0] += options.deltaminval[0]; minval[1] += options.deltaminval[1]; }
        if(options.deltamaxval){ maxval[0] += options.deltamaxval[0]; maxval[1] += options.deltamaxval[1]; }

        let deltaval = [maxval[0] - minval[0], maxval[1] - minval[1]];
        deltaval = [deltaval[0] || 1, deltaval[1] || 1];

        return { minval, maxval, deltaval, isLegStr };
    }

    _renderLayout(){ this.container.innerHTML = "";
		if(this.options.name){
			const title = document.createElement("div");
			title.style.display = "block";
			title.textContent = this.options.name;
			this.container.appendChild(title); }

		const mainWrapper = document.createElement("div");
		mainWrapper.style.display = "flex"; 
		mainWrapper.style.alignItems = "flex-start";

		this.ctx.setTransform(1, 0, 0, -1, 0, this.height); // Инверсия координат
		mainWrapper.appendChild(this.canvas);

		if(this.options.legend !== false){ const yAxis = this._createAxis('y'); mainWrapper.appendChild(yAxis); }

		this.container.appendChild(mainWrapper);

		if(this.options.legend !== false){ const xAxis = this._createAxis('x'); this.container.appendChild(xAxis); }
	}

    _createAxis(type){ let dataSets = this.dataSets; const { minval, deltaval, isLegStr } = this.bounds;
		const isY = type === 'y'; let columns = this.options.columns || 8;
		const drSize = isY ? Math.floor(this.height * 0.97) : Math.floor(this.width * 0.97);

		const axis = document.createElement("div");
		axis.style.cssText = isY 
			? `width:35px; height:${this.height}px; position:relative; display:inline-block;`
			: `width:${this.width}px; height:20px; position:relative;`;

		let tofix = 0; const d = isY ? deltaval[1] : deltaval[0]; let step = d / (columns - 1);
		if(step < 0.1){ tofix = 4; }else if(step < 1){ tofix = 2; }
		if(isLegStr&&!isY&&dataSets[0].length<columns){ columns=dataSets[0].length; }

		for(let i = 0; i < columns; i++){
			const spos = (drSize / (columns - 1) * i).toFixed(2);
			const span = document.createElement("span"); let fontSz=10;
			span.style.position = "absolute"; span.style.fontSize = String(fontSz)+"px";

			if(isY){ span.style.left = "4px"; span.style.bottom = `${spos-fontSz/2-1}px`;
				span.innerHTML = (minval[1] + deltaval[1] * (spos / drSize)).toFixed(tofix); }
			else{ span.style.top = "4px"; span.style.left = `${spos}px`;
				span.innerHTML = isLegStr ? (dataSets[0][i][0] || "End") : (minval[0] + deltaval[0] * (spos / drSize)).toFixed(tofix); }
			axis.appendChild(span); if(this.options.setka) this._drawGridLine(spos, isY); } return axis; }

    _drawGridLine(pos, isHorizontal){ this.ctx.strokeStyle = "gray"; this.ctx.beginPath();
        if(isHorizontal){ this.ctx.moveTo(0, pos); this.ctx.lineTo(this.width, pos); } 
		else{this.ctx.moveTo(pos, 0); this.ctx.lineTo(pos, this.height); } this.ctx.stroke(); }

    _renderData(){ const { dataSets, ctx, bounds, options, height } = this; const { minval, deltaval, isLegStr } = bounds;
        const drwidth = Math.floor(this.width * 0.97); const drheight = Math.floor(this.height * 0.97);

        let colors = options.colors || (options.color ? [options.color] : ["blue", "green", "red"]);
		
		for(let i in dataSets){ let dataSet = dataSets[i]; const color = colors[i] || "blue";
            ctx.strokeStyle = color; ctx.fillStyle = color; ctx.beginPath();
			
            for (let pn in dataSet){ let point = [...dataSet[pn]]; if(isLegStr) point[0] = Number(pn);
                let x = Math.floor(drwidth * ((point[0] - minval[0]) / deltaval[0]));
                let y = Math.floor(drheight * ((point[1] - minval[1]) / deltaval[1]));
                ctx.lineTo(x, y); if(!this.options.simple){ ctx.arc(x, y, 3, 0, 2 * Math.PI); ctx.moveTo(x, y); }  } ctx.stroke(); } }

    _initEvents(){ const { dataSets, canvas, height, bounds } = this; const names = this.options.names || [];
	
        this._evHandler = (e) => { let found = null;
            const rect = canvas.getBoundingClientRect();
            // m.y инвертируется обратно для сравнения с данными внутри transform
            const m = { x: e.clientX - rect.left, y: height - (e.clientY - rect.top) + 1 };
            
            const drwidth = Math.floor(this.width * 0.97);
            const drheight = Math.floor(this.height * 0.97);

            for(let i in dataSets){ let dataSet = dataSets[i];
                const currentNames = names[i] || ["x", "y"];
                for(let pn in dataSet){ let point = [...dataSet[pn]]; if(bounds.isLegStr) point[0] = Number(pn);

                    const px = Math.floor(drwidth * ((point[0] - bounds.minval[0]) / bounds.deltaval[0]));
                    const py = Math.floor(drheight * ((point[1] - bounds.minval[1]) / bounds.deltaval[1]));

                    if(Math.hypot(m.x - px, m.y - py) < 4){
                        found = {
                            pos: [px + rect.left + 6, height - (py - rect.top + 10)],
                            data: { x: [currentNames[0], point[0]], y: [currentNames[1], point[1]] } }; break; }
                }
            }
            if (found){ if(!this.ischmdiv){ this._openModal(found.pos, found.data); this.ischmdiv = true; } }
			else{ this._closeModal(); this.ischmdiv = false; }
        };
		canvas.onmousemove = this._evHandler;
    }
	
	_clearEvents(){ if(this.canvas.onmousemove){ this.canvas.onmousemove = null; this._closeModal(); } }

    _openModal(position, data){ let tip = document.getElementById("div-modal-chart");
        if(!tip){ tip = document.createElement("div"); tip.id = "div-modal-chart"; document.body.appendChild(tip); }
        tip.style.cssText = `border:3px solid #ffd700; border-radius: 5px; background: #FFFFFF; margin: auto; position: fixed; top:${position[1]}px; left:${position[0]}px; padding: 5px; z-index: 1000; opacity: 1; visibility: visible;`;
        tip.innerHTML = `<button onclick="this.parentElement.style.opacity=0" style="float:right;border:0px;background:none;color:#ffd700;font-size:10px;">X</button><br>
                         ${data.y[0]}:${data.y[1]}<br>${data.x[0]}:${data.x[1]}`; }
    _closeModal(){ const tip = document.getElementById("div-modal-chart");
        if(tip){ tip.style.opacity = "0"; tip.style.visibility = "hidden"; } }

	static calcFunc(fn, limit = 10, step = 1, start = 0){ let dataSet = []; let x = start; for(let i = 0; i < limit; i++){ dataSet.push([x, fn(x)]); x += step; } return dataSet; }
	renderFunc(fn, limit = 10, step = 1, start = 0){ this.draw([this.constructor.calcFunc(fn, limit, step, start)]); }
		
    randomizer(limit = 10){ let cords = []; for(let i = 0; i < limit; i++) cords.push([i, Math.random()]); this.draw([cords]); }
}