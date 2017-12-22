   
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

    function dateToString(date){
        return MONTH_NAMES[date.getMonth()] + " " + date.getFullYear();
    }
    


    // prints a marker on the map at the location of the input event
    function printEvent(event){
        svg.append("circle")
            .on('mouseover', function(d){
                fillInfobox(d3.select(this), event.id, true, true);
            })
            .on('mouseout', function(d){
                fillInfobox(d3.select(this), event.id, false, true);
            })
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
            .on('mouseover', function(d){
                fillInfobox(d3.select(this), event.id, true, true);
            })
            .on('mouseout', function(d){
                fillInfobox(d3.select(this), event.id, false, true);
            })
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
                .on('mouseover', function(d){
                    fillInfobox(d3.select(this), event.id, true, false);
                })
                .on('mouseout', function(d){
                    fillInfobox(d3.select(this), event.id, false, false);
                })
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

    function showInfoTooltip(d) {
        d3.select(this).style('color', 'white');
            d3.select("#infotooltip").style('visibility', 'visible')
            .transition()        
            .duration(200)      
            .style("opacity", 1);      
    }

    function hideInfoTooltip(d) {
        d3.select(this).style('color', MAP_COLOR);        
        d3.select("#infotooltip").style('visibility', 'hidden')
            .transition()        
            .duration(500)      
            .style("opacity", 0);   
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
                return 0.4*height + ((i*50)) + "px";
            });
    }

    function printRanking(ranking){
        let ranks = d3.select('#ranking').selectAll('.ranks').data(ranking);

        ranks.attr('id', x=>'rank_'+x[0]);
        ranks.html(x => "<img src=./data/" + x[0] + ".png alt='"+ x + "' title='" + COUNTRY_NAMES[x[0]] + "'> <span class='rankspan'>" + x[1] + "</span>")
            //.sort(function(a, b) {return d3.ascending(b[1], a[1]);})
            .transition()
            .style('top', function(d, i) {
                return 0.4*height + ((i*50)) + "px";
            });
    }

    // updates the size of each div on the info panel according to
    // the number of tests ran by each country up to current_date
    function rankingBarSizes(rankings){
        let minSize = 62;
        let maxSize = panel.node().getBoundingClientRect().width * 0.9 - 10;
        console.log(maxSize)
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

    // returns the html code that will fill the 
    // infobox on the left when mouseover an explosion
    function testToString(id){
        let test = window.site_data[id];
        let name = test.name == '' ? '-' : test.name;
        let site = test.site == '' ? '-' : test.site;
        let result = "";
        result += "<div>Name: " + name + "</div><br/>";
        result += "<div>Country: " + COUNTRY_NAMES[test.country] + "</div><br/>";
        result += "<div>Site: " + site + "</div><br/>";
        result += "<div>Magnitude [Richter scale]: " + test.magnitude + "</div><br/>";
        result += "<div>Date: " + dateToString(test.date) + "</div><br/>";
        return result;
    }

    // called when mouseover a circle
    // fills the infobox on the left and highlights the circle
    function fillInfobox(circle, event_id, over, highlight){
        let infobox = d3.select('#infobox');
        if(over){
            infobox.style('opacity', 0).style('opacity', 1);
            infobox.html(testToString(event_id));
            if(highlight) circle.style('stroke-width', '3px');
        }
        else {
            infobox.style('opacity', 1).style('opacity', 0);
            infobox.html('');
            if(highlight) circle.style('stroke-width', '1px');
        }
    }