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

var div = d3.select("#tooltip");

d3.select('#infoButton')
.on("mouseover", function(d) {
    d3.select(this).style('color', 'white');
    div.transition()        
    .duration(200)      
    .style("opacity", 1);      
    div.html(vizInfoToString()); 
})                  
.on("mouseout", function(d) {  
    d3.select(this).style('color', MAP_COLOR);        
    div.transition()        
    .duration(500)      
    .style("opacity", 0);   
});

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

// Open a new tab and focus on it
function openInNewTab(url) {
	var win = window.open(url, '_blank');
	win.focus();
}

// Returns, if any, contextual information for a given event
function getContext(event) {
    context = window.contextual_data.filter(context => context.id == event.id);
    if(context) {
        return context[0];
    }
}

// print the input date in the date container
function printDate(date){
    d3.select('#month').html(MONTH_NAMES[date.getMonth()]);
    d3.select('#year').html(date.getFullYear());
}

// print infos in the info panel
function vizInfoToString(){
    return "<strong><i>What is the pupose of the visualization?</i></strong><br/><br/>This map shows all the nuclear events that happened around the world and some different treaties signed for this matter.<br/><br/><strong><i>How does this work?</i></strong><br/><br/>You can simply use the date slide at the bottom of the page to navigate through time. The current date is displayed in the top-left corner of your screen. Each bubble that pops on the map represents a nuclear test. The flag indicates the country that ran the test and the radius of the circle represents the magnitude of the test. Some information can be found for different events, you can enable and disable them by using the bubble button at the top left.The history button will pause the animation and show all the nuclear events that happened until the date currently displayed by the slider. <br/><br/><strong><i>The histogram</i></strong><br/><br/>The histogram above the slider displays the amount of nuclear events for each year. It gives an insight about the most active years in the nuclear's history.<br/><br/><strong><i>The information panel (on the left)</i></strong><br/><br/>This small animation corresponds to the total amount of nuclear events ran by each country up to the current date. It shows the proportion of nuclear activity every country has.<br/><br/><strong><i>The data</i></strong><br/><br/>The data comes from the Geoscience Agency of Australia.<br/><br/><strong><i>Authors</i></strong><br/><br/>This data visualization was realized by <strong>Raphaël Steinmann</strong>, <strong>Semion Sidorenko</strong> and <strong>Alain Milliet</strong> in the scope of Prof. Kirell Benzi's Data Visualisation course at EPFL.<br/><br/><strong><i>Compatible browsers</i></strong><br/><br/>This visualization was developped and tested on Google Chrome. As this project was conducted in less than two months, there is no guarantee that it runs perfectly on other browsers."
}

// prints a marker on the map at the location of the input event
function printEvent(event){
    svg.append("circle")
    .attr("class", "event")
    .attr("cx", event.x)
    .attr("cy", event.y)
    .attr("fill", "url(#"+event.country+")")
    .attr("r", 0)
    .transition()
    .duration(animation_time)
    .attr("r", Math.exp(event.magnitude * 2/3))
    .transition()
    .duration(animation_time)
    .attr("r", 0)
    .remove();
}

// prints a marker on the map at the location of the input event
function printClickEvent(event){
    svg.append("circle")
    .attr("class", "event")
    .attr("cx", event.x)
    .attr("cy", event.y)
    .attr("fill", "url(#"+event.country+")")
    .attr("r", 0)
    .transition()
    .duration(animation_time)
    .attr("r", Math.exp(event.magnitude * 2/3));
}

// prints instant marker on the map for the history
function printInstantEvent(event){
    svg.append("circle")
    .attr("class", "event instant_event")
    .attr("cx", event.x)
    .attr("cy", event.y)
    .attr("fill", "url(#"+event.country+")")
    .attr("r", Math.exp(event.magnitude * 2/3))
    .style("opacity", 0.5);
}

function printContext(event, context) {
    let contextSpan = $('<span class="context" id="'+event.id+'">');
    contextSpan.html('<p>' + context.description + '</p> <a href="' + context.url + '">' +
        context.url + '</a>');
    contextSpan.css({
        position: "absolute",
        display: "none",
    });

    let space = 45;
    if(event.x < width/2) {
        contextSpan.css({
            left: event.x+45,
            top: event.y+45,
        });
        contextSpan.append('<span class="leftarrow">&#8598;</span>');
    } else {
        contextSpan.css({
            right: width-event.x+45,
            top: event.y+45,
        });
        contextSpan.append('<span class="rightarrow">&#8599;</span>');
    }
    $('#container-div').append(contextSpan);
    contextSpan.fadeIn(animation_time);
}

// Remove context info
function removeContext(event) {
    $('#'+event.id).fadeOut(animation_time/10, () => $('#'+event.id).remove());
}

// Remove all context info
function removeAllContext() {
    $('.context').fadeOut(animation_time, () => $('.context').remove());
}

// Remove all context info instantly
function removeInstantAllContext() {
    $('.context').fadeOut(10, () => $('.context').remove());
}

function showTreaty(currentDate) {
    let year = currentDate.getFullYear();
    let toRemove = [];
    for (var i=0; i < treatyYears.length; i++) {
        if (treatyYears[i]>year){
            console.log(treatyYears[i]);
            let treaties = window.nuclear_treaties.filter(treaty => treaty.year == treatyYears[i]);
            let treaty = treaties[0];
            d3.select("#"+(treaty.name).split(' ').join('_'))
            .remove();
            
            toRemove.push(i);
        }
    }
    for (var i = 0; i<toRemove.length; i++){
        treatyYears.splice(toRemove[i], 1);
    }
    let treaties = window.nuclear_treaties.filter(treaty => treaty.year <= year);
    if(treaties.length) {
     for (var i=0; i < treaties.length; i++) {
        treaty = treaties[i];
        if (treatyYears.indexOf(treaty.year)==-1){
           treatyYears.push(treaty.year)
           let treatySpan = $('<span class="treaty" id='+(treaty.name).split(' ').join('_')+' onclick=openInNewTab("'+treaty.url+'") onmouseover=this.style.background="white" onmouseout=this.style.background="rgba(235,235,235,0.8)">');
           treatySpan.html('<p>' + treaty.year + " " + treaty.name +'</p>');

				// Get the histogram bar for this year, and get its absolute position
				let barPos = $('g[data-year="' + (treaty.year + 1) + '"]')[0].getBoundingClientRect();

				// Make the span invisible before appending it
				treatySpan.hide();
				// Append it so we can compute its height and width
				$('#container-div').append(treatySpan);

				// Use the bar position, and the span's height and width to position the treaty info span
				treatySpan.css({
					left: barPos.left - treatySpan.width() - SCREEN_WIDTH*0.2 - 20,
					top: barPos.top - treatySpan.height() - 20,
					position: 'absolute'
				});
				treatySpan.append('<span class="arrow">&#8600;</span>');

				treatySpan.fadeIn(animation_time);
			}
		}
	}
}

//This function is called when the slider is moved manually
//input: The date (START_DATE to END_DATE) corresponding to the slider position
function onSlideEvent(date) {
    let previous_date = current_date;
    current_date = date;
    printDate(current_date);
    timeHandle.attr("cx", x(current_date));
    step_size = NORMAL_SPEED;
    removeInstantShownCircles();
    removeInstantAllContext();
    showTreaty(current_date);
    updatebars(previous_date, current_date);
}

// Continue the transition of current shown circles
function removeShownCircles() {
    d3.selectAll(".event")
    .transition()
    .duration(animation_time)
    .style('r',0)
    .remove();
}

// Instant remove of current shown circles
function removeInstantShownCircles() {
    d3.selectAll(".event")
    .remove();
}

// called at each tick of the timer
function step(stepSize){
    printDate(current_date);
    let previous_date = current_date;
    current_date = d3.timeDay.offset(current_date, stepSize);
    if(current_date>=END_DATE){
        current_date = START_DATE;
        pauseAnimation();
        playButton.goToNextState();
    }
    update(previous_date, current_date);
    updatebars(previous_date, current_date);
    showTreaty(current_date);
}

// Update visualization in function of two dates
function update(previous_date, current_date){
    printDate(current_date);
    timeHandle.attr("cx", x(current_date));
    window.site_data.filter(event => (event.date <= current_date && event.date > previous_date)).forEach(event => {
        context = getContext(event);
        if(context && showContext) {
            contextsShown+=1;
            printContext(event, context);
            if(step_size!=SLOW_SPEED){
                last_speed = step_size;
            }
            changeSpeed(SLOW_SPEED);
            if (!click){
                setTimeout(function(){
                    if (timer){
                        removeContext(event);
                    }
                }, 1.9 * animation_time);
                setTimeout(function(){
                    if (contextsShown==1){
                        changeSpeed(last_speed);
                        //removeShownCircles();
                    }
                    contextsShown-=1;
                }, 2*animation_time);
            }
        }
        if(click && !timer){
            printClickEvent(event);
        } else {
            printEvent(event);
        }
    }); 

    let ranking = getRanking(current_date);
    printRanking(ranking);
    rankingBarSizes(ranking);
    click = false;
}

// Change speed 
function changeSpeed(speed){
    step_size = speed;
    animation_time = 3000 / step_size
}

// Update histogram colors in function of two dates
function updatebars(previous_date, current_date){
    d3.selectAll(".bar").filter(d => (d.x0 <= current_date && d.x0 > previous_date))
    .attr("fill", INACTIVE_BAR_COLOR).transition().duration(500)
    .attr("fill", ACTIVE_BAR_COLOR);
    
    d3.selectAll(".bar").filter(d => (d.x0 > current_date && d.x0 <= previous_date))
    .attr("fill", ACTIVE_BAR_COLOR).transition().duration(500)
    .attr("fill", INACTIVE_BAR_COLOR);
}

function playAnimation(){
    if(!timer) timer = setInterval(function(d){step(step_size);}, 10);
    was_running = true;
    hideHistory();
    removeShownCircles();
    removeAllContext();
    changeSpeed(last_speed);
}

function pauseAnimation(){
    let previous_state = timer;
    if(timer){
        clearInterval(timer);
        timer = false;
    }
    hideHistory();
    return previous_state;
}

// Prepare the data for histogram
function prepare(d) {
  var datesplit = d.date.split('/')
  d.date = new Date(parseInt(datesplit[2]), parseInt(datesplit[1])-1, parseInt(datesplit[0]));
  return d;
}

// Return the number of years between 2 dates
function diff_years(dt2, dt1){
    var diff =(dt2.getTime() - dt1.getTime()) / 1000;
    diff /= (60 * 60 * 24);
    return Math.abs(Math.round(diff/365.25));
}

// Displays the history of nuclear incidents or hides it called when the history button is clicked
function showHideHistory() {
    if(!history){
        window.site_data.filter(event => (event.date <= current_date)).forEach(event => printInstantEvent(event));
        if(timer){
            pauseAnimation();
            playButton.goToNextState();
        }
        history = true;
        d3.select('#historyButton').style('color', 'white');
    }
    else{
        d3.selectAll('.instant_event').remove();
        history = false;
        d3.select('#historyButton').style('color', MAP_COLOR);
    }
}

// hides the history if it's displayed, otherwise does nothing
function hideHistory(){
 if(history){
    d3.selectAll('.instant_event').remove();
    history = false;
    d3.select('#historyButton').style('color', MAP_COLOR);
} 
}

// Displays the context informations of nuclear incidents or hides it called when the show context button is clicked
function showHideContext() {
    if(!showContext){
        showContext = true;
        d3.select('#showContextButton').style('color', 'white');
    }
    else{
        showContext = false;
        removeAllContext();
        step_size = NORMAL_SPEED;
        d3.select('#showContextButton').style('color', MAP_COLOR);
    }
}

// returns the number of explosions per country up to the date given
function getRanking(date){
    let n_tests_per_country = {};
    allCountries.forEach(c => n_tests_per_country[c] = 0);
    window.site_data.filter(event => (event.date <= current_date)).map(e => e.country).forEach(c => n_tests_per_country[c] += 1);
    // return an array because an object's order cannot be guaranted
    let ranking = [];
    Object.keys(n_tests_per_country).forEach(key => ranking.push([key, n_tests_per_country[key]]));
    ranking.sort(function(a, b){
        return b[1] - a[1];
    });
    return ranking;
}

function initRanking(){
    let ranks = d3.select('#ranking').selectAll('.ranks').data(allCountries);

    ranks.enter()
    .append('div')
    .attr('class', 'ranks')
    .attr('id', x => 'rank_'+x)
    .style('width', '62px')
    .html(x => "<img src=./data/" + x + ".png alt='"+ x + "' title='" + COUNTRY_NAMES[x] + "'> <span class='rankspan'>0</span>")
    .style('top', function(d, i) {
        return 270 + ((i*50)) + "px";
    });
}

function printRanking(ranking){
    let ranks = d3.select('#ranking').selectAll('.ranks').data(ranking);

    ranks.attr('id', x=>'rank_'+x[0]);
    ranks.html(x => "<img src=./data/" + x[0] + ".png alt='"+ x + "' title='" + COUNTRY_NAMES[x[0]] + "'> <span class='rankspan'>" + x[1] + "</span>")
        //.sort(function(a, b) {return d3.ascending(b[1], a[1]);})
        .transition()
        .style('top', function(d, i) {
            return 270 + ((i*50)) + "px";
        });
    }

// updates the size of each div on the info panel according to
// the number of tests ran by each country up to current_date
function rankingBarSizes(rankings){
    let minSize = 62;
    let maxSize = panel.node().getBoundingClientRect().width - 20;
    let max_nucl = 1056;
    let scale = d3.scaleLinear().domain([0, max_nucl]).range([minSize, maxSize]);
    let sizes = rankings.map(r => [r[0], scale(r[1])]);
    sizes.forEach(function(d){
        let elem = d3.select('.ranks#rank_'+d[0]);
        // only do transitions if the viz is on pause to avoid delays
        if(!timer){
            elem.transition().style('width', d[1]+'px');
        }
        else{
            elem.style('width', d[1]+'px');
        }
    });
}


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
