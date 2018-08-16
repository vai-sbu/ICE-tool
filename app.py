import json

from flask import Flask, render_template, request, redirect, Response, jsonify
import pandas as pd

app = Flask(__name__)

@app.route("/", methods = ['POST', 'GET']) # View function for the app
def index():
    if request.method == 'POST': # Collect the Post request when the user clicks a bar
        column_received = request.form['column'] # Get the variable selected by the user
        value_received = request.form['value'] # Get the category within the variable selected by the user
        switch_received = request.form['switch'] # "on" or "off"
        print(column_received)
        print(value_received)
        print(switch_received)
        filtered_data = data_dummy # Create a new dataframe to edit the values
        if value_received == 'all':
            unique_values = list(data[column_received].unique()) # Create a list of categories in the selected variable
            if switch_received == 'off':
                for value in unique_values:
                    on_cols.remove(column_received+'_'+value) # Remove all the categories from on_cols
                    if column_received+'_'+value not in off_cols: # Add all the categories to off_cols if not already present
                        off_cols.append(column_received+'_'+value)
                
            else:
                for value in unique_values:
                    off_cols.remove(column_received+'_'+value) # Remove the categories from off_cols
                    if column_received+'_'+value not in on_cols: # Add the categories to on_cols if not already present
                        on_cols.append(column_received+'_'+value)
        else:
            if switch_received == 'off': # Remove the selected bar from on_cols and add to off_cols list
                on_cols.remove(column_received+'_'+value_received)
                off_cols.append(column_received+'_'+value_received)
            else: # Add the bar to on_cols and remove from off_cols
                on_cols.append(column_received+'_'+value_received)
                off_cols.remove(column_received+'_'+value_received)
            
        # Remove the off_cols from filtered data
        for col in off_cols:
            filtered_data = filtered_data.loc[filtered_data[col] == 0]
        
        # For every column in on_cols, calculate the min and max thp and update the dataframes
        for col in on_cols:
            cur_var = col.split('_')[0] # Get the value of the variable from the string
            cur_cat = col.split('_')[1] # Get the value of category from the string
            temp = filtered_data.loc[filtered_data[col] == 1] # Get the subset dataframe where only the current variable in 1
            min_thp = temp.Throughput.min() # Get the min thp for this column
            max_thp = temp.Throughput.max() # Get the max thp for this column
            data_tochange = dataframes[cur_var] # Get the dataframe generated from original data to change the values
            data_tochange.set_index(cur_var, inplace=True) # Set the index to categories of the current variable
            data_tochange.at[cur_cat, 'Max'] = max_thp # Update the max thp value
            data_tochange.at[cur_cat, 'Min'] = min_thp # Update the min thp value
            data_tochange.reset_index(inplace=True)
            dataframes[cur_var] = data_tochange # Replace the previous dataframe with the newly calculated values of thp
            
            # Now it's time to send the dataframes to the client
            for col in columns[:-1]:
                dataframe_tosend = dataframes[col] # Get the updated dataframe
                chart_df = dataframe_tosend.to_dict(orient='records') # Convert the dataframe to dict
                chart_df = json.dumps(chart_df) # Create a JSON object
                data_tosend[col] = chart_df # Add to the data_tosend dict
            
            data_tosend['Max Thp'] = filtered_data.Throughput.max()
            data_tosend['Min Thp'] = filtered_data.Throughput.min()
            return jsonify(data_tosend)
    else:
        filtered_data = data_dummy # Create a new dataframe to edit the values
        '''
            In the next step, a new dataframe is created storing the variable categories and 
            the Max and Min Throughput value for each category. This new dataframe is then 
            converted to a JSON dictionary and sent to the client.
        '''
        cur_variable = on_cols[0].split('_')[0] # Used to store the variable part of the string, for ex: Workload_Data is a string them cur_variable will store "Workload".
        global_temp_df = pd.DataFrame() # Dataframe used to store the categories and their Max and Min Throughput values
        for col in on_cols: # For all the bars that are currently in the "on" state
            temp = filtered_data.loc[filtered_data[col] == 1] # Get the dataframe where the current category for a given variable is 1 i.e. 'on'. This is used to plot individual bars.
            temp_var = col.split('_')[0] # Get the variable part of the string
            temp_cat = col.split('_')[1] # Get the category part of the string
            if temp_var == cur_variable: # There is no change in the variable of the col
                global_temp_df = global_temp_df.append({temp_var: temp_cat, 'Max': temp.Throughput.max(), 'Min': temp.Throughput.min()}, ignore_index=True)
                # Append a row in the global_temp_df that includes the Min and Max values for a new category of current variable
            else:
                dataframes[cur_variable] = global_temp_df # Add the value of current dataframe to the dataframes dict for storage
                # Code to create a JSON Object start -------------

                chart_df = global_temp_df.to_dict(orient='records') # Convert the dataframe to a dict
                chart_df = json.dumps(chart_df) # Create a JSON object
                data_tosend[cur_variable] = chart_df # Add the JSON object to JSON array which is sent to the client

                # JSON object code end here --------------
                cur_variable = temp_var # A new variable is detected, so change the value of cur_variable to the new variable
                temp_df = pd.DataFrame(columns=[temp_var, 'Max', 'Min']) # Create a new temporary dataframe because a new variable type is detected
                temp_df = temp_df.append({temp_var: temp_cat, 'Max': temp.Throughput.max(), 'Min': temp.Throughput.min()}, ignore_index=True) # Add the Max and Min throughput values to the temp dataframe for current category
                global_temp_df = temp_df # Change global_temp_df to this new dataframe for a new variable

        # At this point, global_temp_df contains the dataframe for the last variable in the dataset. We need to add this dataset to the JSON array data_tosend
        
        dataframes[cur_variable] = global_temp_df # Add the value of current dataframe to the dataframes dict for storage
        # Code to create a JSON Object start -------------

        chart_df = global_temp_df.to_dict(orient='records') # Convert the dataframe to a dict
        chart_df = json.dumps(chart_df) # Create a JSON object
        data_tosend[cur_variable] = chart_df # Add the JSON object to JSON array which is sent to the client

        # JSON object code end here --------------
        data_tosend['Max Thp'] = filtered_data.Throughput.max()
        data_tosend['Min Thp'] = filtered_data.Throughput.min()
        return render_template('index.html', data=data_tosend)



if __name__=="__main__":
    '''
        This method is run only once when the server is started
    '''
    data = pd.read_csv('dataset/systems_data.csv') # # Reading the dataset is done only once when the server is started
    columns = list(data.columns) # Crete a list of columns in the dataset
    for col in columns[:-1]: # For all columns except throughput
        data[col] = data[col].apply(str) # Change the datatype for each column to be of type string so that there are no conflicts when performing calculations on each of the columns
    data_dummy = pd.get_dummies(data) #Since all the data in categorical, this creates a boolean dummy dataframe by creating columns of all the categories for each variable. This creates a column for each bar displayed
    column_dummy = list(data_dummy.columns)
    on_cols = list(column_dummy[1:]) # List of bars that are turned on. Initially, all the bars are on. We start from 1st index because column_dummy[0] = Throughput
    off_cols = [] # No bars are turned off initially
    data_tosend = {'columns': columns[:-1]}
    data_tosend['Max Cols'] = len(column_dummy)-1 # Total number of bars to display i.e. all columns in the dummy dataframe except throughput
    dataframes = {} # This variable stores all variables in the dataset and the statistics of throughput for each of these variables. It is a dict of dataframes
    app.run(debug=True)
    # app.run(host='0.0.0.0', threaded=True)