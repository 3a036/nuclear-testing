    $(window).resize(function(){location.reload();});
    // Generate the world map from topojson file
    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const START_DATE = new Date("1945-01-01");
    const END_DATE = new Date("2020-12-31");
    const SCREEN_WIDTH = window.innerWidth;
    const MARGIN = SCREEN_WIDTH/100;
    const TIMEBAR_WIDTH = d3.select('#slider').node().clientWidth - 60;
    const PATH_TO_MAP = './data/worldMap.json';
    const INACTIVE_BAR_COLOR = 'white';
    const ACTIVE_BAR_COLOR = 'red';
    const COUNTRY_NAMES = {'GBR':'United Kingdom','USA':'United States of America', 'CHN':'China','FRA':'France','IND':'India','NK':'North Korea','PAK':'Pakistan','SOV':'Sovietic Union','UNK':'Unknown'};
    const MAP_COLOR = '#707779';//'#9DA3A4';
    const BACKGROUND_COLOR = '#121E21'//'#4B4B51';
    const SLOW_SPEED = 1;
    const NORMAL_SPEED = 5;
    
    let contextsShown = 0;
    let step_size = NORMAL_SPEED; // represents the speed of the slider
    let last_speed = step_size;
    let animation_time = 30/ (step_size)
    let was_running = false;
    let container = d3.select("#container-div");
    let panel = d3.select('#panel');
    let width = container.node().clientWidth;
    let height = container.node().clientHeight;
	let rankheight = 50;
    let current_date = START_DATE;
    let timer;
    let histHeight = height/5;
    let bins;
    let allCountries = [];
    let treatyYears = [];
    let history = false;
    let showContext = false;
    let click = false;
    

    container.style('background-color', BACKGROUND_COLOR);
    panel.style('background-color', BACKGROUND_COLOR);
    container.style('border-left', '1px solid ' + MAP_COLOR);
    d3.select('#historyButton')
        .on('mouseover', function(d){
            d3.select(this).style('color', 'white');
        })
        .on('mouseout', function(d){
            if(!history){
                d3.select(this).style('color', MAP_COLOR);
            }
        })
        .on('click', function(d){
            showHideHistory();
        });
        
    d3.select('#showContextButton')
        .on('mouseover', function(d){
            d3.select(this).style('color', 'white');
        })
        .on('mouseout', function(d){
            if(!showContext){
                d3.select(this).style('color', MAP_COLOR);
            }
        })
        .on('click', function(d){
            showHideContext();
        });
        
        
    d3.select('#infoButton').on("click", showInfoTooltip);

    d3.select("#infotooltip").select('.close a').on('click', hideInfoTooltip);

    d3.select('#githubButton')
        .on('mouseover', function(d){
            d3.select(this).style('color', 'white');
        })
        .on('mouseout', function(d){
            d3.select(this).style('color', MAP_COLOR);
        })
        .on('click', function(d){
            openInNewTab("https://github.com/rbsteinm/DataVisualizationProject");
        });
    
    d3.select('#processBookButton')
        .on('mouseover', function(d){
            d3.select(this).style('color', 'white');
        })
        .on('mouseout', function(d){
            d3.select(this).style('color', MAP_COLOR);
        })
        .on('click', function(d){
            openInNewTab("https://rbsteinm.github.io/DataVisualizationProject/process-book.pdf");
        });

    let svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);
    
    let defs = svg.append('defs');
    
    // projection of the world map
    var projection = d3.geoMercator()
      .scale(width / 2 / Math.PI)
      .center([0,-5])
      .translate([width / 2, height / 2 + 140]);
    
    d3.json(PATH_TO_MAP, function(error, topology) {
        if (error) throw error;

        var geojson = topojson.feature(topology, topology.objects.countries);

        svg.selectAll("path")
            .data(geojson.features)
            .enter().append("path")
            .style('fill', MAP_COLOR)
            .attr("d", d3.geoPath().projection(projection));
    });
    
    // Time slider
    var viewHistogram = d3.select("#histogram")
        .append("svg")
        .attr('width', SCREEN_WIDTH - MARGIN*2)
        .attr('height', 500)
        .attr("transform", function(d) {
            return "translate(" + 20 + "," + 0 + ")";
          });
        
    var x = d3.scaleTime()
        .domain([START_DATE, END_DATE])
        .range([0, TIMEBAR_WIDTH])
        .clamp(true);

    // y scale for histogram
    var y = d3.scaleLinear()
        .range([histHeight, 0]);
    
    // set parameters for histogram
    var histogram = d3.histogram()
        .value(function(d) { return d.date; })
        .domain(x.domain())
        .thresholds(x.ticks(d3.timeYear));
        
    var hist = viewHistogram.append("g")
        .attr("class", "histogram");
    
    // Create binned data + images for display on map
    d3.tsv("./data/nuclear_test.tsv", prepare, function(data) {
    // group data for bars
      bins = histogram(data);
      
      // y domain based on binned data
      y.domain([0, d3.max(bins, function(d) { return d.length; })]);
      
      data.forEach(function(d, i) {
            if (d3.select("#"+d.country).empty()){
                allCountries.push(d.country);
                defs.append("pattern")
                    .attr("id", d.country)
                    .attr("height","100%")
                    .attr("width", "100%")
                    .attr("patternContentUnits", "objectBoundingBox")
                    .append("image")
                    .attr("height","1")
                    .attr("width","1")
                    .attr("preserveAspectRatio","none")
                    .attr("xlink:href","./data/"+d.country+".png");  
            }
      });

      var bar = hist.selectAll('.bar')
        .data(bins)
        .enter()
        .append("g")
        .attr("class", "bar")
        .attr("transform", function(d) {
            return "translate(" + x(d.x0) + "," + y(d.length) + ")";
        })
        .attr("data-year", function(d) {
            return d.x0.getFullYear();
        });
            
        bar.append("rect")
            .attr("class", "bar")
            .attr("x", 1)
            .attr("width", function(d) {return x(d.x1) - x(d.x0) - 5 ; })
            // Add 0.01 to each bar because 0 height bars get a buggy bounding box on firefox
            .attr("height", function(d) {return histHeight - y(d.length) + 0.01;}) 
            .attr("fill", INACTIVE_BAR_COLOR)
            .attr("rx", 3)
            .attr("ry", 3);

    }); 

    // Loading the data
    d3.tsv("./data/nuclear_test.tsv")
    .row(function(d) {
      var datesplit = d.date.split('/');
      return {
        id: d.id,
        magnitude: parseInt(d.magnitude),
        country: d.country,
        name: d.name,
        site: d.site,
        textual_location: d.textual_infos,
        type: d.type,
        x: projection([d.lng, d.lat])[0],
        y: projection([d.lng, d.lat])[1],
        date: new Date(parseInt(datesplit[2]), parseInt(datesplit[1])-1, parseInt(datesplit[0]))
      };
    })
    .get(function(err, rows) {
        if (err) return console.error(err);
        window.site_data = rows;
        initRanking();
		rankheight = d3.select('.ranks').node().clientHeight;
    });
    
    // Loading contextual data
    d3.tsv("./data/nuclear_test_context.tsv")
    .row(function(d) {
      return {
        id: d.id,
        description: d.description,
        url: d.url
      };
    })
    .get(function(err, rows) {
        if (err) return console.error(err);
        window.contextual_data = rows;
    });

    // Load nuclear treaties
    d3.tsv("./data/nuclear_treaties.tsv")
    .row(function(d) {
      var datesplit = d.date_effective.split('/');
      return {
        url: d.url,
        name: d.name,
        year: parseInt(datesplit[2]),
        date: new Date(parseInt(datesplit[2]), parseInt(datesplit[1])-1, parseInt(datesplit[0]))
      };
    })
    .get(function(err, rows) {
        if (err) return console.error(err);
        window.nuclear_treaties = rows;
    });

    // Time slider
    var viewSlider = d3.select("#slider")
        .append("svg")
        .attr('width', SCREEN_WIDTH - MARGIN*2)
        .attr('height', 50); 
       
    var timeSlider = viewSlider.append("g")
        .attr('id', 'timebar')
        .attr('width', TIMEBAR_WIDTH)
        .attr("transform", "translate(" + 30 + "," + 20 + ")");

    timeSlider.append("line")
        .on("click", function(){
            timeHandle.attr('cx', d3.mouse(this)[0]);
            previous_date = new Date(current_date);
            current_date = x.invert(d3.mouse(this)[0]);
            updatebars(previous_date, current_date);
            removeShownCircles();
            removeAllContext();
            step_size = NORMAL_SPEED;
            previous_date = new Date(current_date);
            previous_date = new Date(previous_date.setMonth(previous_date.getMonth()-12));
            click = true;
            update(previous_date, current_date);
            showTreaty(current_date);
            hideHistory();
        })
        .attr("class", "timeline")
        .attr("x1", x.range()[0])
        .attr("x2", x.range()[1]);

    let ticks = [];
    for(let i = 0; i < diff_years(END_DATE,START_DATE); i+=5){
        ticks.push(new Date(START_DATE.getFullYear() + i, 1, 0));
    }
    
    timeSlider.insert('g')
        .attr('class', 'ticks')
        .attr('transform', 'translate(0,' + 25 + ')')
        .selectAll('text')
        .data(ticks)
        .enter().append('text')
        .attr('x', d => x(d))
        .attr("text-anchor", "middle")
        .text(d => d.getFullYear());

    var timeHandle = timeSlider.insert("circle")
        .attr("class", "handle")
        .attr("cx", 0)
        .attr("r", 10)
        .call(d3.drag()
        .on('start', function(){
            was_running = pauseAnimation();
            removeShownCircles();
        })
        .on("drag", function(){
            onSlideEvent(x.invert(d3.event.x));
        })
        .on("end", function(){            
            previous_date = new Date(current_date);
            previous_date = new Date(previous_date.setMonth(previous_date.getMonth()-12));
            click = true;
            update(previous_date, current_date);
            hideHistory();
            if(was_running) playAnimation();
        }));    
    
    // PlayPause button inspired from : http://bl.ocks.org/guilhermesimoes/fbe967d45ceeb350b765
    var playButton = {
        el: document.querySelector(".play-button"),
        states: {
            playing: {
                nextState: "paused",
                iconEl: document.querySelector("#pause-icon")
            },
            paused:  {
                nextState: "playing",
                iconEl: document.querySelector("#play-icon")
            }
        },
        animationDuration: 350,
        init: function () {
            this.setInitialState();
            this.replaceUseEl();
            this.el.addEventListener("click", this.goToNextState.bind(this));
        },
        setInitialState: function () {
          var initialIconRef = this.el.querySelector("use").getAttribute("xlink:href");
          var stateName = this.el.querySelector(initialIconRef).getAttribute("data-state");
          this.setState(stateName);
        },
        replaceUseEl: function () {
            d3.select(this.el.querySelector("use")).remove();
            d3.select(this.el.querySelector("svg")).append("path")
                .attr("class", "js-icon")
                .attr("d", this.stateIconPath());
        },
        goToNextState: function () {
            if (this.state.nextState == "paused") {
              pauseAnimation();
              d3.selectAll(".event").transition().duration(animation_time);
              // timer = 0;
            } else {
              // timer that moves the slider automatically
              playAnimation();
              changeSpeed(last_speed);
            }
            this.setState(this.state.nextState);
            d3.select(this.el.querySelector(".js-icon")).transition()
                .duration(this.animationDuration)
                .attr("d", this.stateIconPath());
        },
        setState: function (stateName) {
            this.state = this.states[stateName];
        },
        stateIconPath: function () {
            return this.state.iconEl.getAttribute("d");
        }
    };
    playButton.init();
    