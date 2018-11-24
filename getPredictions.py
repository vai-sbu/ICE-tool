import pandas as pd
import logging
logging.basicConfig(filename='error.log', level=logging.DEBUG)

def getPredictions(filtered_data, on_cols):
    col_list = list(on_cols)
    col_list.append('Throughput')
    thp_data = filtered_data[col_list]
    thp_sorted = thp_data.sort_values(by='Throughput', ascending=False) # Sort the dataframe based on Throughput values to get the rows with highest throughput for the given state
    num_pred = 3 # (Number of future predictions to be made)-1 
    # In this case, we want to make 4 predictions, but we already calcuated the first column, 
    # So now, 3 more predictions are to be made.
    '''
    In the line below, we are calculating the columns in the first row of the sorted
    dataframe where the the values are 1 i.e. the columns that can give the highest value
    of the throughput. After getting the list of desired columns, we chose the first value
    from this list to add to the pred_list variable.
    '''
    pred_list = []
    pred_list.append(list(thp_sorted.columns[thp_sorted.iloc[0]==1])[0])
    
    for i in range(num_pred):
        col_name = pred_list[-1] # Get the latest value added to pred_list
        # print(pred_list)
        # Filter the data i.e. only keep the current selected column in the dataframe
        new_data = thp_sorted.loc[thp_sorted[col_name]==1]
        print(new_data.shape)
        # Remove the current selected column to get the new dataframe
        '''
        We do this because now we have a dataframe where the latest selected predicted variable
        is 1. We need to drop this column to get the next prediction, otherwise we will end up
        adding the same column name to pred_list if it's not removed from the dataframe.
        ''' 
        if new_data.shape[0] > 1:
            new_data = new_data.drop(col_name, axis=1)
            # Sort the new_data based on throughput
            thp_sorted = new_data.sort_values(by='Throughput', ascending=False)
            # Append the new calculated column value into pred_list
            pred_list.append(list(thp_sorted.columns[thp_sorted.iloc[0]==1])[0])
        else:
            break
    
    return pred_list