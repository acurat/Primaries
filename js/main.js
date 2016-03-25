
var data;
var party;
var lastStateClicked;
var gopCandidates = {};
var demCandidates = {};
var colors = ["#283681", "#DAA520", "#29AB87", "#C60E3B", "#D4AA00", "#228B22", "##FFEBCD", "#A52A2A", "#FF1493"];
var huff_post_api_url = "http://elections.huffingtonpost.com/pollster/api/charts.json?callback=?";


/*
	Color states according to the winners for the party
*/
var colorMap = function(party, data){

	d3.selectAll(".state").style("fill","#E0E0E0");

	//For each state
	for(var i=0; i<data.length; i++){
		//with results available
		if(data[i].estimates.length > 0){
			//Fill state with candidate color
			d3.select("#"+data[i].state).style("fill", function(){
				var winner = data[i].estimates[0].choice;
				return party === "gop" ? gopCandidates[winner] : demCandidates[winner];
			});
		}
	}
};

/*
	Assign colors from colors array to state winners 
*/
var assignColors = function(party, data){
	var winner;
	var colorIndex = 0;

	//Iterate through party results
	for(var i=0; i<data.length; i++){
		//Check if estimates for available for the state
		if(data[i].estimates !=null && data[i].estimates.length > 0){
			//Check if a person has won it (safety)
			if (data[i].estimates[0].first_name != null){
				winner = data[i].estimates[0].choice;
				//Add to party candidates object
				if(party === "gop" && gopCandidates[winner] == undefined){
					gopCandidates[winner] = colors[colorIndex++];					
				}else if (party === "dem" && demCandidates[winner] == undefined){
					demCandidates[winner] = colors[colorIndex++];
				}else{
					//do nothing
				}

			}			
		}
	}
}

/*
	Update legend with state winners for the selected party
*/
var createLegend = function(party){

	//Get legend box
	var legend = d3.select('#legend');
	//Remove all elements
	legend.selectAll("*").remove();
	//Add Header
	legend.append("h4")
 		.text("Color Legend");
	var candidates = (party == 'gop'? gopCandidates : demCandidates);

	//Create Legend of winners and their colors
	Object.keys(candidates).forEach(function(key,index) {
    	legend.append("div")
    	 .attr("class", "legendBox")
    	 .style("background-color",candidates[key])
    	 .append("p").text(key)
    	 .attr("class", "legendText");		    
	});
};

/*
	Update page header and other CSS after party selection
*/
var updateHeader = function(party){
	//Get the page header
	var header = d3.select("#header");
	//Update according to party
	if(party === "gop"){
		header.text("Republican Party presidential primaries, 2016")
		.style("color", "#ff0000");
	}else{
		header.text("Democratic Party presidential primaries, 2016")
		.style("color", "#0000ff");
	}
}

/*
	Update summary section with data for the selected state 
	or the overall US summary.
*/
var updateSummary = function(state){
	//Select summary section
	var summary = d3.select("#summary");
	//Remove all existing elements
	summary.selectAll("*").remove();
	//Add header
	summary.append("h4")
 		.text(state.title);

 	// if estimates are available
	if(state.estimates.length > 0){

		//Add a <p> for each candidate
		summary.append("div")
 			.selectAll("p")
 			.data(state.estimates)
 			.enter()
 			.append("p").html(function(d) {

 			//Could also be Undecided or Others, So check first name
		 	var name;
		  	if(d.first_name == null){
		 		name = d.choice;
		  	}else{
		  		name = d.first_name + " " + d.last_name;
		  	}

		  	//Add candidate name and percentage of votes won
		  	return "<span class='name'>" + name + "</span>"
			  	 + "<span class='percent'>" + d.value + "%</span>";
		});

	} else { // if estimates are not available, display election date
		summary.append("p")
		.text("The election date for this "+
			"state is on " + state.election_date);
	}
};

/*
	Get json data for the selected party
	Can be further improved by caching the data
*/
var getData = function(party){	
	/*
		Using JQuery's ajax api to get jsonp features.
		d3.json does not support CORS as of today.
	*/
	$.ajax({
	    url: huff_post_api_url,
	 
	    // The name of the callback parameter, as specified by the YQL service
	    jsonpCallback: "pollsterCallback",

	    cache: true,

	    async: false,
	 
	    // Tell jQuery we're expecting JSONP
	    dataType: "jsonp",

	    contentType: "application/json",

	    data: {
	    	topic: function() {
	    		if(party == "gop"){
	    			return "2016-president-gop-primary"
	    		}else{
	    			return "2016-president-dem-primary"
	    		}
	    	}
	    },
	 
	    // Work with the response
	    success: function( response ) {
	       
	       	//Store data for retrieval during click events
			data = response;
			//Assign color for each state winner 
			assignColors(party, response);
			//Create the color legend using the assigned color
			createLegend(party);
			//Color the states in the map using the assigned color
			colorMap(party, response);
			//Update page CSS (Header, etc)
			updateHeader(party);
			//Update the summary section on the side
			updateSummary(response[0]);

	    },

	    //Log the error on console
	    error: function (error) {
	    	console.log( error ); 
	    }
	});
};

/*
	Assign click event for states. Display voting percentage on the side.
*/
d3.selectAll(".state").on("click", function() {
	//Get state ID
	var stateId = d3.select(this).attr("id");

	if(lastStateClicked == stateId)
		return;

	//Remove highlight for previously selected state
	d3.selectAll("#"+lastStateClicked).style("stroke-width", 1);
	//Highlight the selected state
	d3.select(this).style("stroke-width", 3);


	lastStateClicked = stateId;
	var found = false;

	//Find data for state
	for(var i=0; i<data.length; i++){
		if(data[i].state == stateId){
			updateSummary(data[i]);
			found = true;
			break;
		}
	}

	//If no data found for the selected state, display error message
	if(!found){
		var summary = d3.select("#summary");
		//Remove previously attached data
		summary.selectAll("*").remove();
		//Display error
		summary.append("p")
			.text("Data for primary not available for this state!")
			.style("color", "red");
	}
});

/*
	On change event for party dropdown
*/
d3.select("#party").on("change", function(){
	getData(this.value);
});

/*
	Start with democrats by default
*/
getData("dem");