import json

from flask import Flask, render_template, request, redirect, Response, jsonify
import pandas as pd
import numpy as np
from natsort import natsorted

def getRequestedData(on_cols, off_cols, blacklist_cols, filtered_data, data_tosend, switch_received, value_received, column_received, dataframes, history_global, columns):    
    # Remove the off_cols from filtered data
    for col in off_cols:
        cur_var = col.split('_')[0]
        if cur_var not in blacklist_cols:
            filtered_data = filtered_data.loc[filtered_data[col] == 0]

    # For every column in on_cols, calculate the min and max thp and update the dataframes
    if not filtered_data.empty: # Filtered data is empty when no such configuration exist. In this case, we return the previous result and no bar changes on frontend
        for col in on_cols:
            cur_var = col.split('_')[0] # Get the value of the variable from the string
            cur_cat = col.split('_')[1] # Get the value of category from the string
            temp = filtered_data.loc[filtered_data[col] == 1] # Get the subset dataframe where only the current variable in 1
            min_thp = temp.Throughput.min() # Get the min thp for this column
            max_thp = temp.Throughput.max() # Get the max thp for this column
            thp_10 = temp.Throughput.quantile(0.1) # Get 10th percentile
            thp_25 = temp.Throughput.quantile(0.25) # Get 10th percentile
            thp_50 = temp.Throughput.quantile(0.5) # Get 10th percentile
            thp_75 = temp.Throughput.quantile(0.75) # Get 10th percentile
            thp_90 = temp.Throughput.quantile(0.9) # Get 10th percentile
            thp_mean = temp.Throughput.mean() # Get 10th percentile
            data_thp = list(temp.Throughput)
            data_tochange = dataframes[cur_var] # Get the dataframe generated from original data to change the values
            data_tochange.set_index(cur_var, inplace=True) # Set the index to categories of the current variable
            data_tochange.at[cur_cat, 'IsPresent'] = 0 # Set the bar to disappear by default. This value is changed in the below if condition in case we get new values of THP for this category.
            data_tochange.reset_index(inplace=True)
            if not np.isnan(min_thp) and not np.isnan(max_thp): # Check for NaN values to prevent dataframe from distorting
                data_tochange.set_index(cur_var, inplace=True) # Set the index to categories of the current variable
                data_tochange.at[cur_cat, 'Max'] = max_thp # Update the max thp value
                data_tochange.at[cur_cat, 'Min'] = min_thp # Update the min thp value
                data_tochange.at[cur_cat, '10'] = thp_10 # Update other values 
                data_tochange.at[cur_cat, '25'] = thp_25
                data_tochange.at[cur_cat, '50'] = thp_50
                data_tochange.at[cur_cat, '75'] = thp_75
                data_tochange.at[cur_cat, '90'] = thp_90
                data_tochange.at[cur_cat, 'Mean'] = thp_mean
                data_tochange.at[cur_cat, 'Data'] = data_thp
                data_tochange.at[cur_cat, 'IsPresent'] = 1 # Since we got new THP values, hence this bar should be present in the plot with it's new size
                data_tochange.reset_index(inplace=True)
                dataframes[cur_var] = data_tochange # Replace the previous dataframe with the newly calculated values of thp
        data_tosend['Max Thp'] = filtered_data.Throughput.max() # Max throughput of full data
        data_tosend['Min Thp'] = filtered_data.Throughput.min() # Min throughput of full data
        data_tosend['10 Thp'] = filtered_data.Throughput.quantile(0.1)
        data_tosend['25 Thp'] = filtered_data.Throughput.quantile(0.25)
        data_tosend['50 Thp'] = filtered_data.Throughput.quantile(0.5)
        data_tosend['75 Thp'] = filtered_data.Throughput.quantile(0.75)
        data_tosend['90 Thp'] = filtered_data.Throughput.quantile(0.9)
        data_tosend['Mean Thp'] = filtered_data.Throughput.mean()
        data_tosend['Data Thp'] = list(filtered_data.Throughput)
        # History disctionary is added to history_global list to record a state change
        history_list = {"on_cols": on_cols, "off_cols": off_cols, "blacklist_cols": blacklist_cols, "Thp Max": filtered_data.Throughput.max(), "Thp Min": filtered_data.Throughput.min()}
        history_global.append(history_list)
        data_tosend['History'] = history_global
        # Now it's time to send the dataframes to the client
        for col in columns[:-1]:
            dataframe_tosend = dataframes[col] # Get the updated dataframe
            chart_df = dataframe_tosend.to_dict(orient='records') # Convert the dataframe to dict
            chart_df = json.dumps(chart_df) # Create a JSON object
            data_tosend[col] = chart_df # Add to the data_tosend dict
    else: # If the filtered data is empty i.e. no such configuration exists
        '''
        Following code undo the operations on on_cols and off_cols done in the upper part of the code
        Since, the filtered data is empty and no such configuration exists, we need to updo the additions and deletions on on_cols and off_cols
        to maintain consistency
        '''
        if switch_received == 'on':
            try:
                on_cols.remove(column_received+'_'+value_received) # Remove the current config from on_cols
            except ValueError:
                pass
            off_cols.append(column_received+'_'+value_received) # Add the current config to off_cols
        else: 
            try:
                off_cols.remove(column_received+'_'+value_received)
            except ValueError:
                pass
            on_cols.append(column_received+'_'+value_received)
        data_tosend['No Config Exist'] = 'True' # Send the message to client that no such configuration exist
    return data_tosend