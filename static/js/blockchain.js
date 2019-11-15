// Set the margins for the svg element
let blkMargin = {top: 20, right: 300, left: 300, bottom: 10}
    , blkWidth = window.innerWidth - blkMargin.left - blkMargin.right
    , blkHeight = 200;


// The scale for the y axis is defined below. 
let y_scale = d3.scaleLinear()
    .domain([data_imported['Min Thp'], data_imported['Max Thp']])
    .range([blkHeight-blkMargin.top-blkMargin.bottom, 0])


function blockchain_draw(data){
    // Delete the previous blockchain-plot to draw the new one in area3
    $('#area3').empty();
    // Create a new svg element and add it to area3
    let svg = d3.select("#area3").append("svg")
    .attr("width", blkWidth + blkMargin.left + blkMargin.right)
    .attr("height", blkHeight + blkMargin.top + blkMargin.bottom)
    .attr("class", "blockchain-svg")
    .append("g")
    .attr("transform", "translate(" + blkMargin.left + "," + blkMargin.top + ")");
    
    // Put the scale on left side of the plot
    svg.append('g')
        .attr('class', 'blkaxis')
        .call(d3.axisLeft(y_scale).tickFormat(d3.format('.2s')))

    // Add y gridlines
    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y_scale).tickSize(-blkWidth)
        .tickFormat('')
        .ticks(9));

    
    // Plot the line for Max thp over the points
    // Get the number of values in the array
    let n = data.length;

    let x_scale = d3.scaleLinear()
        .domain([0, n-1])
        .range([1, n*50]) // Because we are plotting each dot 50 pixels away from the previous dot

    // Defining the line generator function
    let line = d3.line()
        .x(function(d, i){
            return x_scale(i);
        })
        .y(function(d){
            return y_scale(d['Thp Max'])
        })
        .curve(d3.curveMonotoneX)
    
    // Generate the line with path generator
    svg.append('path')
        .datum(data)
        .attr('class', 'line')
        .attr('d', line)

    // Repeat the above code for thp min
    // Defining the line generator function
    let line_min = d3.line()
        .x(function(d, i){
            return x_scale(i);
        })
        .y(function(d){
            return y_scale(d['Thp Min'])
        })
        .curve(d3.curveMonotoneX)
    
    // Generate the line with path generator
    svg.append('path')
        .datum(data)
        .attr('class', 'line_min')
        .attr('d', line_min)

    // Plot the dots for min throughput for each value in history array
    svg.append('g')
    .selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cy', function(d){
        return y_scale(d['Thp Min']);
    })
    .attr('cx', function(d, i){
        return x_scale(i);
    })
    .attr('r', 6)
    .style('fill', 'blue')
    .on('click', function(d,j){
        $.post("/blockchain", {'index': j}, function(data_infunc){
            data_received = data_infunc
            if (data_received['No Config Exist'] == 'True'){ // Check if the selected configuration exist, if no, tell the user about it
                if(data_toserver['switch'] == 'on'){
                    selection.push({'id': column[i]+dataset[j][column[i]]});
                    tempAlert("Configuration doesn't exist",700);
                }
                else{
                    let k = selection.length;
                    while(k--){ // Check if the current selection by the user is present in selection array
                        if(selection[k].id == column[i]+dataset[j][column[i]]){
                            is_present = true;
                            selection.splice(k,1); // Remove the current bar from selection array as it was by default, pushed into the selection array.
                        }
                    }
                    tempAlert("Error: Either configuration doesn't exist OR Press the Button to turn off the full variable instead.", 2500);
                }
            }
            else{
                blockchain_draw(data_received['History']);
                redraw(data_received); // Redraw the bars based on current received information
            }
        })
    })

    // For each value in history array, plot a dot for max throughtput
    svg.append('g')
        .selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cy', function(d){
            return y_scale(d['Thp Max']);
        })
        .attr('cx', function(d, i){
            return x_scale(i);
        })
        .attr('r', 6)
        .style('fill', 'red')
        .on('click', function(d,j){
            $.post("/blockchain", {'index': j}, function(data_infunc){
                data_received = data_infunc
                if (data_received['No Config Exist'] == 'True'){ // Check if the selected configuration exist, if no, tell the user about it
                    if(data_toserver['switch'] == 'on'){
                        selection.push({'id': column[i]+dataset[j][column[i]]});
                        tempAlert("Configuration doesn't exist",700);
                    }
                    else{
                        let k = selection.length;
                        while(k--){ // Check if the current selection by the user is present in selection array
                            if(selection[k].id == column[i]+dataset[j][column[i]]){
                                is_present = true;
                                selection.splice(k,1); // Remove the current bar from selection array as it was by default, pushed into the selection array.
                            }
                        }
                        tempAlert("Error: Either configuration doesn't exist OR Press the Button to turn off the full variable instead.", 2500);
                    }
                }
                else{
                    blockchain_draw(data_received['History']);
                    redraw(data_received); // Redraw the bars based on current received information
                }
            })
        })
    
}

// The following line is used to call the draw function for the first time when the app is loaded
blockchain_draw(data_imported['History']);
