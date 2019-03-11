let column = data_imported.columns; // Get the column names from the dataset except throughput
let margin = {top: 30, right: 20, bottom: 0, left: 70}; // Set the margins for the svg object
let margin_result = {top: 30, right: 20, bottom: 0, left: 20}; // Set the margins for the result svg object, which is the svg in "area2" of the index.html file
let result_svg_height = 730; // Height of the svg in Area2
let result_svg_width = 100; // Width of svg in Area2
let result_bar_width = 60; // Bar width of svg in Area2
let svgHeight = 730, barPadding = 10; // Svg height and bar padding for Area1
let max_cols = data_imported['Max Cols']; // Get the maximum number of bars that are to be drawn in Area1
let barWidth = (parseFloat(document.getElementById('area1').offsetWidth-margin.left-120)/(max_cols+column.length)); // Calculate bar width by dividing the width of Area1 by (max cols + number of gaps i.e. number of variables in the dataset)
// let data_received = data_imported; // Data received captures the new data when user clicks on some bar or a button. Initially it is equal to original dataset but later it changes.
let colorScale = d3.scaleOrdinal(d3.schemeCategory10) // To add different colors to bars representing each variable in the dataset
    .domain(column);
let linearScale = d3.scaleLinear() // Scale to scale throughput values to the height of svg
    .domain([data_imported['Min Thp'], data_imported['Max Thp']])
    .range([svgHeight-300,0])

let button_pressed = {}; // Variable to store whether or not the button is pressed

// To plot the distribution of data along with bar charts, we need to create bins with the help of histogram class in d3
let histoChart = d3.histogram();

colorcodes = ['#4f4f4f', '#828282', '#bdbdbd', '#d9d9d9', '#828282', '#4f4f4f']; // color codes for the 6 sections on each bar. First color is for max to 90th percentile.
violincolor = '#ff0099'; // color of the distribution displayed on the bar
meancolor = '#000000' // color of the mean circle that is displayed at the center of the bar
boundarycolor = '#0571b0'; // color of the box surrounding bars from each category

/*
There might be cases where certain combinations of bars don't exist in the dataset. For such combinations, we need to create an alert box 
for the user information. The following function creates an alert box.
*/
function tempAlert(msg,duration){ // Function to generate an alert box for configuration doesn't exist
     var el = document.createElement("div");
     el.setAttribute("style","position:absolute;top:5%;left:40%;background-color:orange;");
     el.innerHTML = msg;
     setTimeout(function(){
      el.parentNode.removeChild(el);
     },duration);
     document.body.appendChild(el);
}


// Redraw function is used to draw all the elements besides the blockchain diagram. It is called everytime the user makes a selection.

function redraw(data_received){ // Redraws every bar when the user makes a selection
    
    // Call display_predictions(data) function in predictions.js to display the predictions on screen
    // display_predictions(data_received['Pred List'])

    // Area1 and Area2 are html elements present in Index.html
    $('#area1').empty(); // Delete every object in Area 1 to redraw everything  
    $('#area2').empty(); // Delete every object in Area 2
    
    // Retreive the last element of the History_global array from the backend.
    // It contains information about which bars are selected by the user and which buttons were clicked

    let hist_data = data_received['History']
    // Retrieve the last element in the history array
    hist_data = hist_data[hist_data.length-1]

    // Off_cols in history array denotes the bars that were selected by the user. So they are not to be displayed in the plot.
    let selection = hist_data['off_cols']; // This array helps keep track of which bar the user clicked

    // Button pressed array keeps track of the buttons that the user pressed. This information is retrieved from blacklist_cols of the history array
    for(let i in column){ // Initially none of the buttons are pressed
        button_pressed[column[i]] = false;
    }
    // Set the columns present in Blacklist cols to true, i.e. these columns are to be displayed as red.
    for(let i in hist_data['blacklist_cols']){
        button_pressed[hist_data['blacklist_cols'][i]] = true;
    }
    
    // These are variables to display each percentile bar next to each other.
    let global_bar_translate = 0; // To draw each bar next to each other
    let global_bar_translate1 = 0;
    let global_bar_translate2 = 0;
    let global_bar_translate3 = 0;
    let global_bar_translate4 = 0;
    let global_bar_translate5 = 0;
    let global_text_translate = 0; // To write the labels for each bar underneath
    let global_violin_translate = 0;
    let global_median1 = 0; // To control the median horizontal whisker left point
    let global_median2 = 0; // To control the median whisker right point

    // Declaring the svg element in area 1
    let svg_elem = d3.select('#area1').append('svg')
        .attr("width", '100%')
        .attr("height", svgHeight)
        .attr("border",1)
        .attr("class", "main-svg")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    column = data_received.columns  // Get the column names from the dataset
    for(let i in column){
        global_bar_translate++; // To create gaps between bars of different variables
        global_bar_translate1++;
        global_bar_translate2++;
        global_bar_translate3++;
        global_bar_translate4++;
        global_bar_translate5++;
        global_text_translate++;
        global_median1++;
        global_median2++;
        global_violin_translate++;

        let dataset = JSON.parse(data_received[column[i]]); // Each element in data_received is the throughput details about a variable in the dataset. Extracting this information in a for loop
        
        // Draw boundaries around bars for each of the categories
        svg_elem.append('g').append('rect')
            .attr('y', linearScale(data_imported['Max Thp'])-10)
            .attr('height', linearScale(data_imported['Min Thp']) - linearScale(data_imported['Max Thp'])+20)
            .attr('width', dataset.length*barWidth+barPadding)
            .attr('fill', 'white')
            .attr('stroke', boundarycolor)
            .attr('stroke-width', 1.5)
            .attr('transform', 'translate('+(barWidth*global_bar_translate-barPadding)+')');

        // Draw the bar chart from Max till 90th percentile
        svg_elem.append('g')
            .selectAll("rect") 
            .data(dataset)
            .enter()
            .append("rect")
            .attr("y", function(d) {
                return linearScale(d.Max); 
            })
            .attr("height", function(d) {
                if(d.IsPresent == 1)
                    return linearScale(d['90']) - linearScale(d.Max);
                else
                    return 0; 
            })
            .attr("fill", colorcodes[0])
            .attr('stroke', 'black')
            .attr('stroke-width', 0.8)
            .attr("width", barWidth - barPadding)
            .attr("opacity", function(d, j){
                let is_present = false;
                for(let k in selection){  // Check if the element is present in selection array, is yes, then plot it with opacity 0.5, otherwise plot it with opacity 1
                    if(selection[k] == column[i]+'_'+dataset[j][column[i]]) 
                    is_present = true;
                }
                if(!is_present){
                    return 0.7
                }
                else{
                    return 0
                }
            })
            .attr("transform", function (d, j) { // Increment globar_bar_translate with each new bar drawn
                let translate = [barWidth * global_bar_translate, 0];
                global_bar_translate++; 
                return "translate("+ translate +")";
            })
            .on("click", function(d,j){
                let data_toserver;
                let is_present = false;
                let k = selection.length
                while(k--){ // Check if the current selection by the user is present in selection array
                    if(selection[k] == column[i]+'_'+dataset[j][column[i]]){
                        is_present = true;
                        break;
                    }
                }
                if(!is_present){ // If element is not present, send swtich value 'off', otherwise 'on'
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'off'};
                }
                else{ 
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'on'};
                }
                // Send the info as a post request to the server
                $.post("", data_toserver, function(data_infunc){
                    data_received = data_infunc; // The server returns new throughput values based on current user selection, update data_received with received information
                    if (data_received['No Config Exist'] == 'True'){ // Check if the selected configuration exist, if no, tell the user about it
                        if(data_toserver['switch'] == 'on'){
                            tempAlert("Configuration doesn't exist",700);
                        }
                        else{
                            let k = selection.length;
                            while(k--){ // Check if the current selection by the user is present in selection array
                                if(selection[k] == column[i]+'_'+dataset[j][column[i]]){
                                    is_present = true;
                                    break;
                                }
                            }
                            tempAlert("Error: Either configuration doesn't exist OR Press the Button to turn off the full variable instead.", 2500);
                        }
                    }
                    else{
                        blockchain_draw(data_received['History']);
                        redraw(data_received); // Redraw the bars based on current received information
                    }
                });
            });

            // Draw bar chart from 90th to 75th percentile

            svg_elem.append('g')
            .selectAll("rect") 
            .data(dataset)
            .enter()
            .append("rect")
            .attr("y", function(d) {
                return linearScale(d['90']); 
            })
            .attr("height", function(d) {
                if(d.IsPresent == 1)
                    return linearScale(d['75']) - linearScale(d['90']);
                else
                    return 0; 
            })
            .attr("fill", colorcodes[1])
            .attr('stroke', 'black')
            .attr('stroke-width', 0.8)
            .attr("width", barWidth - barPadding)
            .attr("opacity", function(d, j){
                let is_present = false;
                for(let k in selection){  // Check if the element is present in selection array, is yes, then plot if with opacity 0.5, otherwise plot it with opacity 1
                    if(selection[k] == column[i]+'_'+dataset[j][column[i]]) 
                    is_present = true;
                }
                if(!is_present){
                    return 0.7
                }
                else{
                    return 0
                }
            })
            .attr("transform", function (d, j) { // Increment globar_bar_translate with each new bar drawn
                let translate = [barWidth * global_bar_translate1, 0];
                global_bar_translate1++; 
                return "translate("+ translate +")";
            })
            .on("click", function(d,j){
                let data_toserver;
                let is_present = false;
                let k = selection.length
                while(k--){ // Check if the current selection by the user is present in selection array
                    if(selection[k] == column[i]+'_'+dataset[j][column[i]]){
                        is_present = true;
                        break;
                    }
                }
                if(!is_present){ // If element is not present, send swtich value 'off', otherwise 'on'
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'off'};
                }
                else{ 
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'on'};
                }
                // Send the info as a post request to the server
                $.post("", data_toserver, function(data_infunc){
                    data_received = data_infunc; // The server returns new throughput values based on current user selection, update data_received with received information
                    if (data_received['No Config Exist'] == 'True'){ // Check if the selected configuration exist, if no, tell the user about it
                        if(data_toserver['switch'] == 'on'){
                            tempAlert("Configuration doesn't exist",700);
                        }
                        else{
                            let k = selection.length;
                            while(k--){ // Check if the current selection by the user is present in selection array
                                if(selection[k] == column[i]+'_'+dataset[j][column[i]]){
                                    is_present = true;
                                    break;
                                }
                            }
                            tempAlert("Error: Either configuration doesn't exist OR Press the Button to turn off the full variable instead.", 2500);
                        }
                    }
                    else{
                        blockchain_draw(data_received['History']);
                        redraw(data_received); // Redraw the bars based on current received information
                    }
                });
            });

            // Draw the bar chart from 75th to Median

            svg_elem.append('g')
            .selectAll("rect") 
            .data(dataset)
            .enter()
            .append("rect")
            .attr("y", function(d) {
                return linearScale(d['75']); 
            })
            .attr("height", function(d) {
                if(d.IsPresent == 1)
                    return linearScale(d['50']) - linearScale(d['75']);
                else
                    return 0; 
            })
            .attr("fill", colorcodes[2])
            .attr('stroke', 'black')
            .attr('stroke-width', 0.8)
            .attr("width", barWidth - barPadding)
            .attr("opacity", function(d, j){
                let is_present = false;
                for(let k in selection){  // Check if the element is present in selection array, is yes, then plot if with opacity 0.5, otherwise plot it with opacity 1
                    if(selection[k] == column[i]+'_'+dataset[j][column[i]]) 
                    is_present = true;
                }
                if(!is_present){
                    return 0.7
                }
                else{
                    return 0
                }
            })
            .attr("transform", function (d, j) { // Increment globar_bar_translate with each new bar drawn
                let translate = [barWidth * global_bar_translate2, 0];
                global_bar_translate2++; 
                return "translate("+ translate +")";
            })
            .on("click", function(d,j){
                let data_toserver;
                let is_present = false;
                let k = selection.length
                while(k--){ // Check if the current selection by the user is present in selection array
                    if(selection[k] == column[i]+'_'+dataset[j][column[i]]){
                        is_present = true;
                        break;
                    }
                }
                if(!is_present){ // If element is not present, send swtich value 'off', otherwise 'on'
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'off'};
                }
                else{ 
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'on'};
                }
                // Send the info as a post request to the server
                $.post("", data_toserver, function(data_infunc){
                    data_received = data_infunc; // The server returns new throughput values based on current user selection, update data_received with received information
                    if (data_received['No Config Exist'] == 'True'){ // Check if the selected configuration exist, if no, tell the user about it
                        if(data_toserver['switch'] == 'on'){
                            tempAlert("Configuration doesn't exist",700);
                        }
                        else{
                            let k = selection.length;
                            while(k--){ // Check if the current selection by the user is present in selection array
                                if(selection[k] == column[i]+'_'+dataset[j][column[i]]){
                                    is_present = true;
                                    break;
                                }
                            }
                            tempAlert("Error: Either configuration doesn't exist OR Press the Button to turn off the full variable instead.", 2500);
                        }
                    }
                    else{
                        blockchain_draw(data_received['History']);
                        redraw(data_received); // Redraw the bars based on current received information
                    }
                });
            });

            // Draw the bar chart from Median to 25th percentile

            svg_elem.append('g')
            .selectAll("rect") 
            .data(dataset)
            .enter()
            .append("rect")
            .attr("y", function(d) {
                return linearScale(d['50']); 
            })
            .attr("height", function(d) {
                if(d.IsPresent == 1)
                    return linearScale(d['25']) - linearScale(d['50']);
                else
                    return 0; 
            })
            .attr("fill", colorcodes[3])
            .attr('stroke', 'black')
            .attr('stroke-width', 0.8)
            .attr("width", barWidth - barPadding)
            .attr("opacity", function(d, j){
                let is_present = false;
                for(let k in selection){  // Check if the element is present in selection array, is yes, then plot if with opacity 0.5, otherwise plot it with opacity 1
                    if(selection[k] == column[i]+'_'+dataset[j][column[i]]) 
                    is_present = true;
                }
                if(!is_present){
                    return 0.7
                }
                else{
                    return 0
                }
            })
            .attr("transform", function (d, j) { // Increment globar_bar_translate with each new bar drawn
                let translate = [barWidth * global_bar_translate3, 0];
                global_bar_translate3++; 
                return "translate("+ translate +")";
            })
            .on("click", function(d,j){
                let data_toserver;
                let is_present = false;
                let k = selection.length
                while(k--){ // Check if the current selection by the user is present in selection array
                    if(selection[k] == column[i]+'_'+dataset[j][column[i]]){
                        is_present = true;
                        break;
                    }
                }
                if(!is_present){ // If element is not present, send swtich value 'off', otherwise 'on'
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'off'};
                }
                else{ 
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'on'};
                }
                // Send the info as a post request to the server
                $.post("", data_toserver, function(data_infunc){
                    data_received = data_infunc; // The server returns new throughput values based on current user selection, update data_received with received information
                    if (data_received['No Config Exist'] == 'True'){ // Check if the selected configuration exist, if no, tell the user about it
                        if(data_toserver['switch'] == 'on'){
                            tempAlert("Configuration doesn't exist",700);
                        }
                        else{
                            let k = selection.length;
                            while(k--){ // Check if the current selection by the user is present in selection array
                                if(selection[k] == column[i]+'_'+dataset[j][column[i]]){
                                    is_present = true;
                                    break;
                                }
                            }
                            tempAlert("Error: Either configuration doesn't exist OR Press the Button to turn off the full variable instead.", 2500);
                        }
                    }
                    else{
                        blockchain_draw(data_received['History']);
                        redraw(data_received); // Redraw the bars based on current received information
                    }
                });
            });
            

            // Draw the bar chart from 25th to 10th percentile

            svg_elem.append('g')
            .selectAll("rect") 
            .data(dataset)
            .enter()
            .append("rect")
            .attr("y", function(d) {
                return linearScale(d['25']); 
            })
            .attr("height", function(d) {
                if(d.IsPresent == 1)
                    return linearScale(d['10']) - linearScale(d['25']);
                else
                    return 0; 
            })
            .attr("fill", colorcodes[4])
            .attr('stroke', 'black')
            .attr('stroke-width', 0.8)
            .attr("width", barWidth - barPadding)
            .attr("opacity", function(d, j){
                let is_present = false;
                for(let k in selection){  // Check if the element is present in selection array, is yes, then plot if with opacity 0.5, otherwise plot it with opacity 1
                    if(selection[k] == column[i]+'_'+dataset[j][column[i]]) 
                    is_present = true;
                }
                if(!is_present){
                    return 0.7
                }
                else{
                    return 0
                }
            })
            .attr("transform", function (d, j) { // Increment globar_bar_translate with each new bar drawn
                let translate = [barWidth * global_bar_translate4, 0];
                global_bar_translate4++; 
                return "translate("+ translate +")";
            })
            .on("click", function(d,j){
                let data_toserver;
                let is_present = false;
                let k = selection.length
                while(k--){ // Check if the current selection by the user is present in selection array
                    if(selection[k] == column[i]+'_'+dataset[j][column[i]]){
                        is_present = true;
                        break;
                    }
                }
                if(!is_present){ // If element is not present, send swtich value 'off', otherwise 'on'
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'off'};
                }
                else{ 
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'on'};
                }
                // Send the info as a post request to the server
                $.post("", data_toserver, function(data_infunc){
                    data_received = data_infunc; // The server returns new throughput values based on current user selection, update data_received with received information
                    if (data_received['No Config Exist'] == 'True'){ // Check if the selected configuration exist, if no, tell the user about it
                        if(data_toserver['switch'] == 'on'){
                            tempAlert("Configuration doesn't exist",700);
                        }
                        else{
                            let k = selection.length;
                            while(k--){ // Check if the current selection by the user is present in selection array
                                if(selection[k] == column[i]+'_'+dataset[j][column[i]]){
                                    is_present = true;
                                    break;
                                }
                            }
                            tempAlert("Error: Either configuration doesn't exist OR Press the Button to turn off the full variable instead.", 2500);
                        }
                    }
                    else{
                        blockchain_draw(data_received['History']);
                        redraw(data_received); // Redraw the bars based on current received information
                    }
                });
            });

            // Draw the bar chart from 10th to Min value

            svg_elem.append('g')
            .selectAll("rect") 
            .data(dataset)
            .enter()
            .append("rect")
            .attr("y", function(d) {
                return linearScale(d['10']); 
            })
            .attr("height", function(d) {
                if(d.IsPresent == 1)
                    return linearScale(d.Min) - linearScale(d['10']);
                else
                    return 0; 
            })
            .attr("fill", colorcodes[5])
            .attr('stroke', 'black')
            .attr('stroke-width', 0.8)
            .attr("width", barWidth - barPadding)
            .attr("opacity", function(d, j){
                let is_present = false;
                for(let k in selection){  // Check if the element is present in selection array, is yes, then plot if with opacity 0.5, otherwise plot it with opacity 1
                    if(selection[k] == column[i]+'_'+dataset[j][column[i]]) 
                    is_present = true;
                }
                if(!is_present){
                    return 0.7
                }
                else{
                    return 0
                }
            })
            .attr("transform", function (d, j) { // Increment globar_bar_translate with each new bar drawn
                let translate = [barWidth * global_bar_translate5, 0];
                global_bar_translate5++; 
                return "translate("+ translate +")";
            })
            .on("click", function(d,j){
                let data_toserver;
                let is_present = false;
                let k = selection.length
                while(k--){ // Check if the current selection by the user is present in selection array
                    if(selection[k] == column[i]+'_'+dataset[j][column[i]]){
                        is_present = true;
                        break;
                    }
                }
                if(!is_present){ // If element is not present, send swtich value 'off', otherwise 'on'
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'off'};
                }
                else{ 
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'on'};
                }
                // Send the info as a post request to the server
                $.post("", data_toserver, function(data_infunc){
                    data_received = data_infunc; // The server returns new throughput values based on current user selection, update data_received with received information
                    if (data_received['No Config Exist'] == 'True'){ // Check if the selected configuration exist, if no, tell the user about it
                        if(data_toserver['switch'] == 'on'){
                            tempAlert("Configuration doesn't exist",700);
                        }
                        else{
                            let k = selection.length;
                            while(k--){ // Check if the current selection by the user is present in selection array
                                if(selection[k] == column[i]+'_'+dataset[j][column[i]]){
                                    is_present = true;
                                    break;
                                }
                            }
                            tempAlert("Error: Either configuration doesn't exist OR Press the Button to turn off the full variable instead.", 2500);
                        }
                    }
                    else{
                        blockchain_draw(data_received['History']);
                        redraw(data_received); // Redraw the bars based on current received information
                    }
                });
            });

        // Draw the Violin Chart over the rectangles
        svg_elem.selectAll('g.violin')
        .data(dataset)
        .enter()
        .append('g')
        .attr('transform', function(d){
            let translate = [barWidth*global_violin_translate];
            global_violin_translate++;
            return 'translate('+translate+')';
        })
        .attr("opacity", function(d, j){
            if(d.IsPresent == 1){
                let is_present = false;
                for(let k in selection){  // Check if the element is present in selection array, is yes, then plot if with opacity 0.5, otherwise plot it with opacity 1
                    if(selection[k] == column[i]+'_'+dataset[j][column[i]]) 
                    is_present = true;
                }
                if(!is_present){
                    return 0.7
                }
                else{
                    return 0
                }
            }
            else    
                return 0
        })
        .append('path')
            .style('stroke', '#ffffff')
            .style('fill', violincolor)
            .style('stroke-width', 0.3)
            .attr('d', function(d){
                // Max bins is used to store the value of maximum number of values in a bucket after the data is passed to histoChart
                let max_bins = 0;
                // Create the buckets with 500 units throughput range
                let thresholds = d3.range(d.Min, d.Max, 500)
                // Create the bins and fill the bins with the number of values lying in respective bins
                histoChart
                    .domain([d.Min, d.Max])
                    .thresholds(thresholds)
                    .value(d => d)
                // Fill the area in the distribution. We use the below function to find the maximum number of values in a bucket. Notice that max_bins is update in the following function
                let area = d3.area()
                    .x0(a => 0)
                    .x1(function(a){
                        max_bins = Math.max(a.length, max_bins);
                        return a.length
                    })
                    .y(a => linearScale(a.x1))
                    .curve(d3.curveCatmullRom);

                // run the below code to find max_bins
                let to_return  = area(histoChart(d.Data));

                // After the max_bins has been calculated for current bar, we assign a scale to keep the width of the distribution within the bar width
                let violin_width_scale = d3.scaleLinear()
                    .domain([0, max_bins])
                    .range([0,barWidth-barPadding])
                
                // Now finally, area is calculated using the above linearScale    
                area = d3.area()
                    .x0(a => 0)
                    .x1(a => violin_width_scale(a.length))
                    .y(a => linearScale(a.x1))
                    .curve(d3.curveCatmullRom);
                    
                // Fill the distribution curve within the bar chart
                return area(histoChart(d.Data))
            })
            .on("click", function(d,j){
                let data_toserver;
                let is_present = false;
                let k = selection.length
                while(k--){ // Check if the current selection by the user is present in selection array
                    if(selection[k] == column[i]+'_'+dataset[j][column[i]]){
                        is_present = true;
                        break;
                    }
                }
                if(!is_present){ // If element is not present, send swtich value 'off', otherwise 'on'
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'off'};
                }
                else{ 
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'on'};
                }
                // Send the info as a post request to the server
                $.post("", data_toserver, function(data_infunc){
                    data_received = data_infunc; // The server returns new throughput values based on current user selection, update data_received with received information
                    if (data_received['No Config Exist'] == 'True'){ // Check if the selected configuration exist, if no, tell the user about it
                        if(data_toserver['switch'] == 'on'){
                            tempAlert("Configuration doesn't exist",700);
                        }
                        else{
                            let k = selection.length;
                            while(k--){ // Check if the current selection by the user is present in selection array
                                if(selection[k] == column[i]+'_'+dataset[j][column[i]]){
                                    is_present = true;
                                    break;
                                }
                            }
                            tempAlert("Error: Either configuration doesn't exist OR Press the Button to turn off the full variable instead.", 2500);
                        }
                    }
                    else{
                        blockchain_draw(data_received['History']);
                        redraw(data_received); // Redraw the bars based on current received information
                    }
                });
            });
            
            
                
        // // Draw Mean circles on the bars
        svg_elem.append('g').selectAll('circle')
            .data(dataset)
            .enter()
            .append('circle')
            .attr('cx', function () { // Increment globar_bar_translate with each new bar drawn
                let translate = barWidth * global_median1 + (barWidth-barPadding)/2;
                global_median1++;
                return translate;
            })
            .attr('cy', function(d){
                return linearScale(d.Mean)})
            .attr('r', function(d, j){
                if(d.IsPresent == 1){
                    let is_present = false;
                    for(let k in selection){  // Check if the element is present in selection array, is yes, then plot if with opacity 0.5, otherwise plot it with opacity 1
                        if(selection[k] == column[i]+'_'+dataset[j][column[i]]){ 
                            is_present = true;
                            break;
                        }
                    }
                    if(!is_present)
                        return '3'
                    else
                        return '0'
                }
                else
                    return '0';
            })
            .attr('fill', meancolor);

        // The following code is to draw the button. In this case, buttons are drawn as rect HTML elements
        svg_elem.append('g').append('rect')
            .attr("transform", function () {
                let translate_start = barWidth*global_text_translate;
                let translate_end = barWidth*global_bar_translate;
                let translate = [(translate_start + translate_end)/2-(column[i].length*5), 580]
                return "translate("+ translate +")"
            })
            .attr('width', 12*column[i].length)
            .attr('height', 20)
            .attr('fill', function(){
                if(button_pressed[column[i]]){
                    return 'red'
                }
                else
                    return '#74c476'
            })
            .attr('opacity', 0.5) 
            .on("click", function(){ // Handling what happens when the button is clicked
                let data_button_tosend; // Dict to send to the server  
                if(!button_pressed[column[i]]){ // Variable is turned off by the user
                    data_button_tosend = {'column': column[i], 'value': 'all', 'switch': 'off'}; // This is the information that is sent to the server when the button is pressed to turn the variable off
                }
                else{ // When the variable is turned on
                    data_button_tosend = {'column': column[i], 'value': 'all', 'switch': 'on'};
                }
                $.post("", data_button_tosend, function(data_infunc){
                    data_received = data_infunc; // The server returns new throughput values based on current user selection, update data_received with received information
                    blockchain_draw(data_received['History']);
                    redraw(data_received); // Redraw the bars based on current received information
                })});
        
        // Add text to the buttons drawn using the above function
        svg_elem.append('g').append('text')
            .attr('class', 'button_text')
            .attr("transform", function () {
                let translate_start = barWidth*global_text_translate;
                let translate_end = barWidth*global_bar_translate;
                let translate = [(translate_start + translate_end)/2-(column[i].length*4), 595];
                return "translate("+ translate +")"
            })
            .text(column[i])
            .on("click", function(){ // Handling what happens when the button is clicked
                let data_button_tosend; // Dict to send to the server  
                if(!button_pressed[column[i]]){ // Variable is turned off by the user
                    data_button_tosend = {'column': column[i], 'value': 'all', 'switch': 'off'}; // This is the information that is sent to the server when the button is pressed to turn the variable off
                }
                else{ // When the variable is turned on
                    // button_pressed[column[i]] = false;
                    data_button_tosend = {'column': column[i], 'value': 'all', 'switch': 'on'};
                }
                $.post("", data_button_tosend, function(data_infunc){
                    data_received = data_infunc; // The server returns new throughput values based on current user selection, update data_received with received information
                    blockchain_draw(data_received['History']);
                    redraw(data_received); // Redraw the bars based on current received information
                })});
        // Add the text below each bar
        let text = svg_elem.append('g').selectAll("text") 
            .data(dataset)
            .enter()
            .append("text")
            .attr('class', 'heavy')
            .text(function(d,j) {
                if(d.IsPresent == 1)
                    return dataset[j][column[i]];
                else
                    return "";
            })
            .attr("transform", function (d, j) {
                let translate = [barWidth * global_text_translate+10, 460]
                global_text_translate++
                return "translate("+ translate +")rotate(60)";
            })
            .attr("fill", function(d, j){
                let is_present = false;
                for(let k in selection){  // Check if the element is present in selection array, is yes, then the text should be black, otherwise red
                    if(selection[k] == column[i]+'_'+dataset[j][column[i]]){
                        is_present = true;
                        break;
                    }
                }
                if(!is_present){
                    return 'black'
                }
                else{
                    return 'red'
                }
            })
            .on("click", function(d,j){
                let data_toserver;
                let is_present = false;
                let k = selection.length
                while(k--){ // Check if the current selection by the user is present in selection array
                    if(selection[k] == column[i]+'_'+dataset[j][column[i]]){
                        is_present = true;
                        break;
                    }
                }
                if(!is_present){ // Add the element to selection array if it is not present and send the information to the server
                    // selection.push({'id': column[i]+'_'+dataset[j][column[i]]});
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'off'};
                }
                else{ 
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'on'};
                }
                $.post("", data_toserver, function(data_infunc){
                    data_received = data_infunc; // The server returns new throughput values based on current user selection, update data_received with received information
                    if (data_received['No Config Exist'] == 'True'){ // Check if the selected configuration exist, if no, tell the user about it
                        if(data_toserver['switch'] == 'on'){
                            // selection.push({'id': column[i]+'_'+dataset[j][column[i]]});
                            tempAlert("Configuration doesn't exist",700);
                        }
                        else{
                            tempAlert("Error: Either configuration doesn't exist OR Press the Button to turn off the full variable instead.", 2500);
                        }
                    }
                    else{
                        blockchain_draw(data_received['History']);
                        redraw(data_received); // Redraw the bars based on current received information
                    }
                });
            });
            
    }
    svg_elem.append('g') // Put scale on the left side of the plot
        .attr('class', 'axis')
        .call(d3.axisLeft(linearScale).tickFormat(d3.format('.2s')))
    svg_elem.append('g') // Put scale on the right side of the plot
        .attr('class', 'axis')
        .attr('transform', 'translate('+(document.getElementById('area1').offsetWidth-150)+',0)')
        .call(d3.axisRight(linearScale).tickFormat(d3.format('.2s')))
    svg_elem.append('g').append('text') // Create the label for left y axis
        .attr('class', 'thp_text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - 200)
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text('Throughput')

    // Code for the horizontal line with mouse hover to assist in finding maximum throughput 
    let mouseG = svg_elem.append('g')
        .attr('class', 'mouse-over-effects') // Append a 'g' element to the main svg

    mouseG.append('path') // Define the line attributes. The class is mouse-line
        .attr('class', 'mouse-line')
        .style('stroke', 'black')
        .style('stroke-width', '1px')
        .style('opacity', '0');

    mouseG.append('svg:rect') // Append the line attributes to the main svg boundaries
        .attr('width', '100%')
        .attr('height', 430)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseout', function(){
            d3.select('.mouse-line')
                .style('opacity', '0')
        })
        .on('mouseover', function(){
            d3.select('.mouse-line')
                .style('opacity', '1')
        })
        .on('mousemove', function(){
            let mouse = d3.mouse(this);
            d3.select('.mouse-line')
            .attr("d", function() {
                var d = "M" + 0 + "," + mouse[1];
                d += " " + ((parseFloat(document.getElementById('area1').offsetWidth))-4*barWidth) + "," + mouse[1];
                return d;
            });
        
        })


    // ****************************** Below is 2nd column code ******************************
    
    // Initialize the svg element in Area2
    let svg_result = d3.select('#area2').append('div').append('svg') 
        .attr("width", result_svg_width)
        .attr("height", result_svg_height)
        .attr("class", "result-svg")
        .append("g")
            .attr("transform", "translate(" + margin_result.left + "," + margin_result.top + ")");
    
    svg_result.append('g').append("rect") // Add the result bar
        .attr("y", linearScale(data_received['Max Thp']))
        .attr("height", linearScale(data_received['90 Thp']) - linearScale(data_received['Max Thp']))
        .attr("width", result_bar_width - barPadding)
        .attr("transform", function () {
            let translate = [margin_result, 0]; 
            return "translate("+ translate +")";
        })
        .attr('fill', colorcodes[0])
        .attr('stroke', 'black')
        .attr('stroke-width', 0.8)
        .attr('opacity', 0.7);

        svg_result.append('g').append("rect") // Add the result bar
        .attr("y", linearScale(data_received['90 Thp']))
        .attr("height", linearScale(data_received['75 Thp']) - linearScale(data_received['90 Thp']))
        .attr("width", result_bar_width - barPadding)
        .attr("transform", function () {
            let translate = [margin_result, 0]; 
            return "translate("+ translate +")";
        })
        .attr('fill', colorcodes[1])
        .attr('stroke', 'black')
        .attr('stroke-width', 0.8)
        .attr('opacity', 0.7);

        svg_result.append('g').append("rect") // Add the result bar
        .attr("y", linearScale(data_received['75 Thp']))
        .attr("height", linearScale(data_received['50 Thp']) - linearScale(data_received['75 Thp']))
        .attr("width", result_bar_width - barPadding)
        .attr("transform", function () {
            let translate = [margin_result, 0]; 
            return "translate("+ translate +")";
        })
        .attr('fill', colorcodes[2])
        .attr('stroke', 'black')
        .attr('stroke-width', 0.8)
        .attr('opacity', 0.7);

        svg_result.append('g').append("rect") // Add the result bar
        .attr("y", linearScale(data_received['50 Thp']))
        .attr("height", linearScale(data_received['25 Thp']) - linearScale(data_received['50 Thp']))
        .attr("width", result_bar_width - barPadding)
        .attr("transform", function () {
            let translate = [margin_result, 0]; 
            return "translate("+ translate +")";
        })
        .attr('fill', colorcodes[3])
        .attr('stroke', 'black')
        .attr('stroke-width', 0.8)
        .attr('opacity', 0.7);

        svg_result.append('g').append("rect") // Add the result bar
        .attr("y", linearScale(data_received['25 Thp']))
        .attr("height", linearScale(data_received['10 Thp']) - linearScale(data_received['25 Thp']))
        .attr("width", result_bar_width - barPadding)
        .attr("transform", function () {
            let translate = [margin_result, 0]; 
            return "translate("+ translate +")";
        })
        .attr('fill', colorcodes[4])
        .attr('stroke', 'black')
        .attr('stroke-width', 0.8)
        .attr('opacity', 0.7);

        svg_result.append('g').append("rect") // Add the result bar
        .attr("y", linearScale(data_received['10 Thp']))
        .attr("height", linearScale(data_received['Min Thp']) - linearScale(data_received['10 Thp']))
        .attr("width", result_bar_width - barPadding)
        .attr("transform", function () {
            let translate = [margin_result, 0]; 
            return "translate("+ translate +")";
        })
        .attr('fill', colorcodes[5])
        .attr('stroke', 'black')
        .attr('stroke-width', 0.8)
        .attr('opacity', 0.7);

    // Draw the Violin chart on the result bar
    svg_result.append('g')
    .attr("transform", function () {
        let translate = [margin_result, 0]; 
        return "translate("+ translate +")";
    })
    .attr('opacity', 0.7)
    .append('path')
        .style('stroke', '#ffffff')
        .style('fill', violincolor)
        .style('stroke-width', 0.3)
        .attr('d', function(){
            // Max bins is used to store the value of maximum number of values in a bucket after the data is passed to histoChart
            let max_bins = 0;
            // Create the buckets with 500 units throughput range
            let thresholds = d3.range(data_received['Min Thp'], data_received['Max Thp'], 500)
            // Create the bins and fill the bins with the number of values lying in respective bins
            histoChart
                .domain([data_received['Min Thp'], data_received['Max Thp']])
                .thresholds(thresholds)
                .value(d => d)
            // Fill the area in the distribution. We use the below function to find the maximum number of values in a bucket. Notice that max_bins is update in the following function
            let area = d3.area()
                .x0(a => 0)
                .x1(function(a){
                    max_bins = Math.max(a.length, max_bins);
                    return a.length
                })
                .y(a => linearScale(a.x1))
                .curve(d3.curveCatmullRom);

            // run the below code to find max_bins
            let to_return  = area(histoChart(data_received['Data Thp']));

            // After the max_bins has been calculated for current bar, we assign a scale to keep the width of the distribution within the bar width
            let violin_width_scale = d3.scaleLinear()
                .domain([0, max_bins])
                .range([0,50])
            
            // Now finally, area is calculated using the above linearScale    
            area = d3.area()
                .x0(a => 0)
                .x1(a => violin_width_scale(a.length))
                .y(a => linearScale(a.x1))
                .curve(d3.curveCatmullRom);
                
            // Fill the distribution curve within the bar chart
            return area(histoChart(data_received['Data Thp']))    
        });


    // Draw the circle for throughput value
    svg_result.append('g').append('circle')
        .attr('cx', margin_result.left + 5)
        .attr('cy', linearScale(data_received['Mean Thp']))
        .attr('r', '4')
        .attr('fill', meancolor);
    

}

redraw(data_imported); // Call the redraw function everytime this script runs
window.addEventListener('resize',redraw); // Bootstrap will run everytime the user tries to resize the window
