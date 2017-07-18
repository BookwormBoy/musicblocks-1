function TimbreWidget () {
	const BUTTONDIVWIDTH = 476;   // 8 buttons 476 = (55 + 4) * 8
    const OUTERWINDOWWIDTH = 685;
    const INNERWINDOWWIDTH = 600;
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    var timbreTableDiv = docById('timbreTableDiv');
    this.env = [];
    this.ENVs = [];
    this.fil = [];
    this.filterParams = [];
    this.osc = [];
    this.oscParams = [];
    this.synthActive = false;
    this.envelopeActive = false;
    this.oscillatorActive = false;
    this.filterActive = false;
    this.effectsActive = false;

    var that = this;
    console.log('timbre initialised');

    this._addButton = function(row, icon, iconSize, label) {
        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        cell.style.width = BUTTONSIZE + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width; 
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        return cell;
    };

    this._update = function(i, value, k){
        var updateParams = [];
        if(this.envelopeActive === true && this.env[i] != null) {
            for(j = 0; j < 4; j++){
                updateParams[j] = this._logo.blocks.blockList[this.env[i]].connections[j+1];
            }
        }
        if(this.filterActive === true && this.fil[i] != null) {
            for(j = 0; j < 3; j++){
                updateParams[j] = this._logo.blocks.blockList[this.fil[i]].connections[j+1];
            }
        }
        if(this.oscillatorActive === true && this.osc[i] != null) {
            for(j = 0; j < 2; j++){
                updateParams[j] = this._logo.blocks.blockList[this.osc[i]].connections[j+1];
            }
        }
        
        if (updateParams[0] != null) {
            if(typeof value === 'string'){
                this._logo.blocks.blockList[updateParams[k]].value = value;
            } else {
                this._logo.blocks.blockList[updateParams[k]].value = parseFloat(value);
            }
            this._logo.blocks.blockList[updateParams[k]].text.text = value.toString();
            this._logo.blocks.blockList[updateParams[k]].updateCache();
            this._logo.refreshCanvas();
            saveLocally();
        }
    };

    this.init = function(logo) {
    	this._logo = logo;
        
        var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = ICONSIZE * this._cellScale;
        var timbreDiv = docById("timbreDiv");
        timbreDiv.style.visibility = "visible";
        timbreDiv.setAttribute('draggable', 'true');
        timbreDiv.style.left = '200px';
        timbreDiv.style.top = '150px';
        
        var widgetButtonsDiv = docById('timbreButtonsDiv');
        widgetButtonsDiv.style.display = 'inline';
        widgetButtonsDiv.style.visibility = 'visible';
        widgetButtonsDiv.style.width = BUTTONDIVWIDTH;
        widgetButtonsDiv.innerHTML = '<table cellpadding="0px" id="timbreButtonTable"></table>';

        var canvas = docById('myCanvas');

        var buttonTable = docById('timbreButtonTable');
        var header = buttonTable.createTHead();
        var row = header.insertRow(0);

        var that = this;
        
        var cell = this._addButton(row, 'play-button.svg', ICONSIZE, _('play all'));
        var cell = this._addButton(row, 'export-chunk.svg', ICONSIZE, _('save'));
        var synthButtonCell = this._addButton(row, 'synth.svg', ICONSIZE, _('synthesizer'));
        synthButtonCell.onclick = function() {
            that.synthActive = true;
            synthButtonCell.id = "synthButtonCell";
            that._synth();
        }
        var oscillatorButtonCell = this._addButton(row, 'oscillator.svg', ICONSIZE, _('oscillator'));
        oscillatorButtonCell.onclick=function() {
        	that.oscillatorActive = true;
            that.filterActive = false;
            that.envelopeActive = false;
            
            oscillatorButtonCell.id = "oscillatorButtonCell";
            that._oscillator();
        }
        var envelopeButtonCell = this._addButton(row, 'envelope.svg', ICONSIZE, _('envelope'));
        envelopeButtonCell.onclick = function() {
            that.envelopeActive = true;
            that.filterActive = false;
            that.oscillatorActive = false;

            envelopeButtonCell.id = "envelopeButtonCell";
            that._envelope();
        }
        var filterButtonCell = this._addButton(row, 'filter.svg', ICONSIZE, _('filter'));
        filterButtonCell.onclick = function() {
            that.filterActive = true;
            that.envelopeActive = false;
            that.oscillatorActive = false;

            filterButtonCell.id = "filterButtonCell";
            that._filter();
        }
        var cell = this._addButton(row, 'effects.svg', ICONSIZE, _('effects'));
        cell.onclick=function() {
        	that._effects();
        }
        var cell = this._addButton(row, 'restore-button.svg', ICONSIZE, _('undo'));
        /*cell.onclick=function() {
            that._undo();
        }*/

        var cell = this._addButton(row, 'close-button.svg', ICONSIZE, _('close'));
        cell.onclick=function() {
            docById('timbreDiv').style.visibility = 'hidden';
            docById('timbreButtonsDiv').style.visibility = 'hidden';
            docById('timbreTableDiv').style.visibility = 'hidden';
        };

        var dragCell = this._addButton(row, 'grab.svg', ICONSIZE, _('drag'));
        dragCell.style.cursor = 'move';

        this._dx = dragCell.getBoundingClientRect().left - timbreDiv.getBoundingClientRect().left;
        this._dy = dragCell.getBoundingClientRect().top - timbreDiv.getBoundingClientRect().top;
        this._dragging = false;
        this._target = false;
        this._dragCellHTML = dragCell.innerHTML;

        dragCell.onmouseover = function(e) {
           	dragCell.innerHTML = '';
        };

        dragCell.onmouseout = function(e) {
            if (!that._dragging) {
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        canvas.ondragover = function(e) {
            e.preventDefault();
        };

        canvas.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                timbreDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
               	timbreDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        timbreDiv.ondragover = function(e) {
            e.preventDefault();
        };

        timbreDiv.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                timbreDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                timbreDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        timbreDiv.onmousedown = function(e) {
            that._dragging = true;
            that._target = e.target;
        };

        timbreDiv.ondragstart = function(e) {
            if (dragCell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };

    };

    this._envelope = function() {
        var that = this;
       
        docById("envelopeButtonCell").style.backgroundColor = "#C8C8C8";
        docById("envelopeButtonCell").onmouseover = function(){};
        docById("envelopeButtonCell").onmouseout =  function(){};

    	timbreTableDiv.style.display = 'inline';
        timbreTableDiv.style.visibility = 'visible';
        timbreTableDiv.style.border = '0px';
        timbreTableDiv.style.overflow = 'auto';
        timbreTableDiv.style.backgroundColor = 'white';
        timbreTableDiv.style.height = '300px';
        timbreTableDiv.innerHTML = '<div id="timbreTable"></div>';

        var env = docById('timbreTable');
      	var htmlElements = "";
		for (var i = 0; i < 4; i++) {
   			htmlElements += '<div id="wrapperEnv'+i+'"><div class="circle">'+("ADSR").charAt(i)+'</div><div id="insideDivEnv"><input type="range" id="myRange'+i+'"class ="sliders" style="margin-top:20px" value="2"><span id="myspan'+i+'"class="rangeslidervalue">2</span></div></div>';
		};

        env.innerHTML = htmlElements;
		var envAppend = document.createElement("div");
		envAppend.id = "envAppend";
		envAppend.style.backgroundColor = MATRIXBUTTONCOLOR;
		envAppend.style.height = "30px";
		envAppend.style.marginTop = "40px";
		envAppend.style.overflow = "auto";
    	env.append(envAppend);

        docById("envAppend").innerHTML = '<button class="btn" id="reset"><b>RESET</b></button>';
        var btnReset = docById("reset");
        btnReset.style.marginLeft = '230px';

        for(var i = 0; i < 4; i++) {
            docById("myRange"+i).value = parseFloat(that.ENVs[i]);
            docById("myspan"+i).textContent = that.ENVs[i];
            that._update(0, that.ENVs[i], i);
        }
        
        for(var i = 0; i < 4; i++){
            document.getElementById("wrapperEnv"+i).addEventListener('change', function(event){
                docById("envelopeButtonCell").style.backgroundColor = "#C8C8C8";
                var elem = event.target;
                var m = elem.id.slice(-1);
                docById("myRange"+m).value = parseFloat(elem.value);
                docById("myspan"+m).textContent = elem.value;
                that._update(0, parseFloat(elem.value), m);
            }); 
        }

       
        btnReset.onclick = function() {
            docById("envelopeButtonCell").style.backgroundColor = MATRIXBUTTONCOLOR;
            for(var i = 0; i < 4; i++) {
                docById("myRange"+i).value = parseFloat(that.ENVs[i]);
                docById("myspan"+i).textContent = that.ENVs[i];
                that._update(0, parseFloat(that.ENVs[i]), i);
            }
        }
    };

    this._filter = function() {
        var that = this;

        docById("filterButtonCell").style.backgroundColor = "#C8C8C8";
        docById("filterButtonCell").onmouseover = function(){};
        docById("filterButtonCell").onmouseout =  function(){};

        timbreTableDiv.style.display = 'inline';
        timbreTableDiv.style.visibility = 'visible';
        timbreTableDiv.style.border = '0px';
        timbreTableDiv.style.overflow = 'auto';
        timbreTableDiv.style.backgroundColor = 'white';
        timbreTableDiv.style.height = '300px';
        timbreTableDiv.innerHTML = '<div id="timbreTable"></div>';

        var env = docById('timbreTable');
        var htmlElements = '<div id="wrapper0"><div id="s" class="rectangle"><span>Type</span></div><div id="sel"></div></div>';
        for (var i = 0; i < 2; i++) {
            htmlElements += '<div id="wrapper'+(i+1)+'"><div id="s'+(i+1)+'" class="rectangle"><span></span></div><div id="insideDivFilter"><input type="range" id="myRangeF'+i+'"class ="sliders" style="margin-top:20px" value="2"><span id="myspanF'+i+'"class="rangeslidervalue">2</span></div></div>';
        };

        env.innerHTML = htmlElements;
        var envAppend = document.createElement("div");
        envAppend.id = "envAppend";
        envAppend.style.backgroundColor = MATRIXBUTTONCOLOR;
        envAppend.style.height = "30px";
        envAppend.style.marginTop = "40px";
        envAppend.style.overflow = "auto";
        env.append(envAppend);

        docById("envAppend").innerHTML = '<button class="btn" id="reset"><b>RESET</b></button>';
        var btnReset = docById("reset");
        btnReset.style.marginLeft = '230px';

        var myDiv = docById("sel");
        
        var selectOpt = '<select id="sel1">';
        for(var i = 0; i < TYPES.length; i++){
            selectOpt += '<option value="'+TYPES[i][0]+'">'+TYPES[i][0]+'</option>';
        }
        selectOpt += '</select>';
        myDiv.innerHTML = selectOpt;

        document.getElementById("wrapper0").addEventListener('change', function(event){
                docById("filterButtonCell").style.backgroundColor = "#C8C8C8";
                var elem = event.target;
                that._update(0, elem.value, 0);
            });

        for(var i = 1; i < 3; i++){
            document.getElementById("wrapper"+i).addEventListener('change', function(event){
                docById("filterButtonCell").style.backgroundColor = "#C8C8C8";
                var elem = event.target;
                var m = elem.id.slice(-1);
                docById("myRangeF"+m).value = parseFloat(elem.value);
                docById("myspanF"+m).textContent = elem.value;
                that._update(0, elem.value, Number(m)+1);
            });
        }

        var sliderRolloff = docById('myRangeF0');
        sliderRolloff.min = -50;
        sliderRolloff.max = 0;

        var sliderFrequency = docById('myRangeF1');
        sliderFrequency.max = 200;
        
        docById("s1").textContent = "RollOff";
        docById("s2").textContent = "Frequency";
        docById("myspanF0").textContent = "-12";
        docById("myspanF1").textContent = "200";

        docById('sel1').value = that.filterParams[0];
        that._update(0, that.filterParams[0], 0);
        for(var i = 1; i < 3; i++) {
            docById("myRangeF"+(i-1)).value = parseFloat(that.filterParams[i]);
            docById("myspanF"+(i-1)).textContent = that.filterParams[i];
            that._update(0, that.filterParams[i], i);
        }

        btnReset.onclick = function() {
            docById("filterButtonCell").style.backgroundColor = MATRIXBUTTONCOLOR;
            docById('sel1').value = that.filterParams[0];
            that._update(0, that.filterParams[0], 0);
            for(var i=1; i < 3; i++) {
                docById("myRangeF"+(i-1)).value = parseFloat(that.filterParams[i]);
                docById("myspanF"+(i-1)).textContent = that.filterParams[i];
                that._update(0, that.filterParams[i], i);
            }
        }
    };

    this._effects = function(){
    	//document.getElementById("timbreTable").style.backgroundColor = 'blue' ;

    };

    this._oscillator = function(){
        var that = this;

        docById("oscillatorButtonCell").style.backgroundColor = "#C8C8C8";
        docById("oscillatorButtonCell").onmouseover = function(){};
        docById("oscillatorButtonCell").onmouseout =  function(){};

        timbreTableDiv.style.display = 'inline';
        timbreTableDiv.style.visibility = 'visible';
        timbreTableDiv.style.border = '0px';
        timbreTableDiv.style.overflow = 'auto';
        timbreTableDiv.style.backgroundColor = 'white';
        timbreTableDiv.style.height = '300px';
        timbreTableDiv.innerHTML = '<div id="timbreTable"></div>';

        var env = docById('timbreTable');
        var htmlElements = '<div id="wrapperOsc0"><div id="sOsc0" class="rectangle"><span>Type</span></div><div id="selOsc"></div></div>';
            htmlElements += '<div id="wrapperOsc1"><div id="sOsc1" class="rectangle"><span></span></div><div id="insideDivOsc"><input type="range" id="myRangeO0"class ="sliders" style="margin-top:20px" value="2"><span id="myspanO0"class="rangeslidervalue">2</span></div></div>';
    
        env.innerHTML = htmlElements;
        var envAppend = document.createElement("div");
        envAppend.id = "envAppend";
        envAppend.style.backgroundColor = MATRIXBUTTONCOLOR;
        envAppend.style.height = "30px";
        envAppend.style.marginTop = "40px";
        envAppend.style.overflow = "auto";
        env.append(envAppend);

        docById("envAppend").innerHTML = '<button class="btn" id="reset"><b>RESET</b></button>';
        var btnReset = docById("reset");
        btnReset.style.marginLeft = '230px';

        var myDiv = docById("selOsc");
        
        var selectOpt = '<select id="selOsc1">';
        for(var i = 0; i < OSCTYPES.length; i++){
            selectOpt += '<option value="'+OSCTYPES[i][0]+'">'+OSCTYPES[i][0]+'</option>';
        }
        selectOpt += '</select>';
        myDiv.innerHTML = selectOpt;

        document.getElementById("wrapperOsc0").addEventListener('change', function(event){
            docById("oscillatorButtonCell").style.backgroundColor = "#C8C8C8";
            var elem = event.target;
            that._update(0, elem.value, 0);
        });

        document.getElementById("wrapperOsc1").addEventListener('change', function(event){
            docById("oscillatorButtonCell").style.backgroundColor = "#C8C8C8";
            var elem = event.target;
            docById("myRangeO0").value = parseFloat(elem.value);
            docById("myspanO0").textContent = elem.value;
            that._update(0, elem.value, 1);
        });
        
        var sliderPartials = docById('myRangeO0');
        sliderPartials.min = 0;
        sliderPartials.max = 20;
        
        docById("sOsc1").textContent = "Partials";
        docById("myRangeO0").value = 6;
        docById("myspanO0").textContent = "6";
       
        docById('selOsc1').value = that.oscParams[0];
        that._update(0, that.oscParams[0], 0);
        docById("myRangeO0").value = parseFloat(that.oscParams[1]);
        docById("myspanO0").textContent = that.oscParams[1];
        that._update(0, that.oscParams[1], 1);

        btnReset.onclick = function() {
            docById("oscillatorButtonCell").style.backgroundColor = MATRIXBUTTONCOLOR;
            docById('selOsc1').value = that.oscParams[0];
            that._update(0, that.oscParams[0], 0);
            
            docById("myRangeO0").value = parseFloat(that.oscParams[1]);
            docById("myspanO0").textContent = that.oscParams[1];
            that._update(0, that.oscParams[1], 1);
        }
    };

    this._synth = function () {
        console.log("heysynth");
    };
};
