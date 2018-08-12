import json

from flask import Flask, render_template, request, redirect, Response, jsonify
import pandas as pd

app = Flask(__name__)

'''
This method is used to calculate the new group by details from the dataset for each new request.
'''
def calculations(filtered_data):
    min_thp = 10000000000000000 # Min thp to a large value to find the min thp
    max_thp = 0 # Max thp to a large value to find the Max thp
    max_col = 0 # Maximum number of categories in the dataset. These are number of bars which will be displayed on the plot
    for col in columns[:-1]: # Columns include Throughput as well, so -1 to exclude Throughput
        col_thp = [col] # Create a list of columns to group by. The columns are grouped by the feature type.
        col_thp.append('Throughput') # Add Throughput to the list. For example col is "workload", then col_thp will contain [Workload, Throughput]
        df_grouped = pd.DataFrame(filtered_data[col_thp].groupby(col).describe()).reset_index() # Calculate the statistics for Throughput for the given column
        df_grouped['Max'] = df_grouped[('Throughput', 'max')] # Get the Max Throughput for current column
        df_grouped['Min'] = df_grouped[('Throughput', 'min')] # Get the Min throughput
        new_chart_df = df_grouped[[col, 'Max', 'Min']] # Filter the columns that we need and remove extra information
        new_chart_df.columns = new_chart_df.columns.droplevel(1) # Because it is a grouped by object, it contains multiple level of columns. So here we filter extra levels that we don't need
        max_thp = max(max_thp, new_chart_df['Max'].max()) # Update the Max Throughput value which is the max thp in all of the current dataset
        min_thp = min(min_thp, new_chart_df['Min'].min()) # Similarly update the min throughput value
        chart_df = dataframes[col] # Dataframe is a dictionary of grouped by dataframes from the original dataset. 
        '''
            Because we want to keep the bar that the user clicks, we don't remove the clicked bar from the dataset but instead, we don't include the "off" bars in the Throughput calculations. Since chart_df in this case consistes of values from the original dataset, hence it contains all the values. But on the other hand, new_chart_df contains only the "on" bars and updated throughput values. Hence we need to update chart_df with the values from new_chart_df but keep every other row in chart_df intact. This will allow us to change the "on" bars based on user selection but no bars will dissappear since we keep the original dataset intact.
        '''
        chart_df.loc[chart_df[col].isin(new_chart_df[col]), ['Max','Min']] = new_chart_df.loc[new_chart_df[col].isin(chart_df[col]),['Max','Min']].values
        '''
            In the above line, we update chart_df with new updated throughput values from new_chart_df. All the rows that are in new_chart_df are updated in chart_df. On the other hand, the rows that are not in new_chart_df, which are the bars that are turned "off" by the user, are kept intact as they were in the original dataset i.e. in chart_df.
        '''
        max_col = max_col + chart_df.shape[0] # Add the number of categories in this Variable to Max Cols i.e. total number of bars to be displayed
        chart_df = chart_df.to_dict(orient='records') # Create a dictionary of the dataframe to send to the frontend to draw bars
        chart_df = json.dumps(chart_df) # Convert the dictionary to JSON object
        data_tosend[col] = chart_df # Add the information in a Json array for the given variable
    data_tosend['Max Cols'] = max_col # Add more information about the Overall dataset which is useful for plotting the bar on the right side.
    data_tosend['Max Thp'] = max_thp
    data_tosend['Min Thp'] = min_thp

    
@app.route("/", methods = ['POST', 'GET']) # View function for the app
def index():
    if request.method == 'POST': # Collect the Post request when the user clicks a bar
        column_received = request.form['column'] # Get the variable selected by the user
        value_received = request.form['value'] # Get the category within the variable selected by the user
        switch_received = request.form['switch'] # "on" or "off"
        print(column_received)
        print(value_received)
        print(switch_received)
        filtered_data = data # Create a new dataframe what will only include "on" values in the dataset
        # Unique values is a dictionary of unique values in a variable. We add the value 
        if value_received == 'all': # Button is pressed for a whole variable
            unique_values[column_received] = list(data[column_received].unique())
            '''
                Notice that turning a full variable on/off doesn't makes any difference. For example, having all features of variable "Workload" in your dataset will give the same result as Not having any feature of variable "Workload". How? Well, in our case, not having any feature of a variable means that that variable is wildcarded i.e. we ignore that variable in our calculations of throughput. Hence, irrespective of what the signal is, we add all the values in the unique_values dictionary
            '''
        else:
            if switch_received == 'off': # Remove the selected bar from unique_values dict
                unique_values[column_received].remove(value_received)
            else: # Add the bar back to unique values dict
                unique_values[column_received].append(value_received)
            
        for item in columns[:-1]: # for all columns except throughput, remove the values that are not in unique_values dict
            if unique_values[item] != []: # The list become empty if the user turns all bars off by clicking on all of them
                filtered_data = filtered_data[filtered_data[item].isin(unique_values[item])]
            else: # If the list is empty, we add all the unique values for that feature back to the list
                filtered_data = filtered_data[filtered_data[item].isin(list(data[item].unique()))]
        calculations(filtered_data)
        print(unique_values) 
        return jsonify(data_tosend)
    else: # This method is executed each time the page is refreshed
        for item in columns[:-1]: # For all columns except throughput
            unique_items = list(data[item].unique()) # Add unique categories within each variable to unique_values dict
            unique_values[item] = unique_items
        min_thp = 10000000000000000 # Assigning a large value to Min Thp initially
        max_thp = 0 # Assigning a low value to Max Thp initially
        max_cols = 0 # Max Cols hold the number of unique categories for all variables i.e. total number of bars to be displayed on the plot
        for col in columns[:-1]: # For all columns except throughput
            col_thp = [col] # Create a list with Throughput appended to the column name
            col_thp.append('Throughput')
            df_grouped = pd.DataFrame(data[col_thp].groupby(col).describe()).reset_index() # Get the statistics for Throughput for the current variable (col)
            df_grouped['Max'] = df_grouped[('Throughput', 'max')] # Get the max throughput from the calculated stats
            df_grouped['Min'] = df_grouped[('Throughput', 'min')] # Get the min throughput
            chart_df = df_grouped[[col, 'Max', 'Min']] # Filter the columns, we need only Max and Min at this moment
            dataframes[col] = chart_df # Create a dict of dataframes and add the current dataframe to this dict for future use. This prevents us from doing the same calculations again and again.
            max_thp = max(max_thp, chart_df['Max'].max()) # Update the Max Thp
            min_thp = min(min_thp, chart_df['Min'].min()) # Update the Min Thp
            chart_df.columns = chart_df.columns.droplevel(1) # Because the group by object consists of multiple levels of columns, we need to drop a level down for simplification
            max_cols = max_cols+chart_df.shape[0] # Add number of categories under current variable to max_cols
            chart_df = chart_df.to_dict(orient='records') # Conver the dataframe to dict
            chart_df = json.dumps(chart_df) # Create a JSON object
            data_tosend[col] = chart_df # Add the JSON object to JSON array 
        data_tosend['Max Cols'] = max_cols
        data_tosend['Max Thp'] = max_thp
        data_tosend['Min Thp'] = min_thp
        return render_template("index.html", data=data_tosend)


if __name__ == "__main__":
    '''
        This method is run only once when the server is started
    '''
    data = pd.read_csv('dataset/systems_data.csv') # Reading the dataset is done only once when the server is started
    columns = list(data.columns) # Get the columns in the dataframe and create a list of the column names
    for col in columns[:-1]: # For all columns except throughput
        data[col] = data[col].apply(str) # Change the datatype for each column to be of type string so that there are no conflicts when performing calculations on each of the columns
    data_tosend = {'columns': columns[:-1]} # Data to send is the JSON dict which is sent to the client to draw the bars. Client need to know the column names for labelling of the bars
    dataframes = {} # This variable stores all variables in the dataset and the statistics of throughput for each of these variables. It is a dict of dataframes
    # Calculating unique values in each column and adding it to unique_values dict
    unique_values = {}
    for item in columns[:-1]:
        unique_items = list(data[item].unique())
        unique_values[item] = unique_items
    app.run(debug=True)