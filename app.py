import json
import os
from flask import Flask, render_template, request, redirect, Response, jsonify, send_from_directory, flash, url_for
import pandas as pd
import numpy as np
from natsort import natsorted
from getRequestedData import getRequestedData
import datetime
from werkzeug.utils import secure_filename
import logging
logging.basicConfig(filename='error.log', level=logging.DEBUG)
# from getPredictions import getPredictions


app = Flask(__name__)

# Read_data_again changes the values of the global variables for the newly uploaded file. After this, the tool will display data of the uploaded file
# The code is same as the main function, we need to do it again so as to read the newly uploaded file
def read_data_again():
    global data
    global columns
    global data_dummy
    global column_dummy
    global on_cols
    global off_cols
    global data_tosend
    global dataframes
    global blacklist_cols
    global history_global
    data = pd.read_csv('dataset/uploaded_file.csv') # Reading the dataset is done only once when the server is started
    columns = list(data.columns) # Crete a list of columns in the dataset
    for col in columns[:-1]: # For all columns except throughput
        data[col] = data[col].apply(str) # Change the datatype for each column to be of type string so that there are no conflicts when performing calculations on each of the columns
    data_dummy = pd.get_dummies(data) #Since all the data in categorical, this creates a boolean dummy dataframe by creating columns of all the categories for each variable. This creates a column for each bar displayed
    column_dummy = list(data_dummy.columns)
    on_cols = [] # List of bars that are turned on. Initially, all the bars are on. We start from 1st index because column_dummy[0] = Throughput
    off_cols = [] # No bars are turned off initially
    data_tosend = {'columns': columns[:-1]}
    data_tosend['Max Cols'] = len(column_dummy)-1 # Total number of bars to display i.e. all columns in the dummy dataframe except throughput
    dataframes = {} # This variable stores all variables in the dataset and the statistics of throughput for each of these variables. It is a dict of dataframes
    blacklist_cols = [] # It stores the variables for which the buttons are turned 'off'. 
    history_global = [] # List used to store on_cols, off_cols and blacklist_cols for each state. Used for blockchain plot

UPLOAD_FOLDER = os.path.join(app.root_path, "dataset") # Path to the folder where the uploaded dataste would be saved
ALLOWED_EXTENSIONS = ['csv'] # Extensions allowed for the datasets to be uploaded to ICE server
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# function to check whether the uploaded dataset is valid
def allowed_file(filename):
    return '.' in filename and \
    filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Function to handle uploaded file
@app.route('/upload', methods=['POST'])
def upload():
    if request.method == 'POST':
        # check if the post request has the file part
        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)
        file = request.files['file']
        # if user does not select file, browser also
        # submit an empty part without filename
        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # The file is saved with the name "uploaded_file.csv" inside the dataset folder
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], 'uploaded_file.csv'))
            read_data_again()
            return redirect(url_for('index'))

# @app.route('/uploads/<filename>')
# def uploaded_file(filename):
#     return send_from_directory(app.config['UPLOAD_FOLDER'],
#                                filename)

@app.route("/blockchain", methods = ['POST']) # This method is called when the user clicks on a blockchain element
def getBlockchainData():
    # Variables that we need to recalculate the dataset are defined as global
    global history_global
    global data_tosend
    global data_dummy
    global dataframes
    global columns

    # Filtered Data to be calculated based on "on_cols, off_cols and blacklist_cols"
    filtered_data = data_dummy
    # Initially we assume that the configuration user selected exists.
    data_tosend['No Config Exist'] = 'False'
    # Get the index of the circle user clicked on the blockchain
    history_index = request.form['index']
    # Get details of "on_cols, off_cols and blacklist_cols" from the history array using the index obtained
    on_cols = history_global[int(history_index)]['on_cols']
    off_cols = history_global[int(history_index)]['off_cols']
    blacklist_cols = history_global[int(history_index)]['blacklist_cols']
    # Recalculate the data at that stage
    data_tosend = getRequestedData(on_cols, off_cols, blacklist_cols, filtered_data, data_tosend, '', '', '', dataframes, history_global, columns)
    return jsonify(data_tosend)

@app.route("/", methods = ['POST', 'GET']) # View function for the app
def index():
    global on_cols
    global off_cols
    global history_global
    global data_tosend
    data_tosend['No Config Exist'] = 'False' # By default, we assume that a configuration selected by the user exists. If it doesn't, we change it later in the code
    if request.method == 'POST': # Collect the Post request when the user clicks a bar
        column_received = request.form['column'] # Get the variable selected by the user
        value_received = request.form['value'] # Get the category within the variable selected by the user
        switch_received = request.form['switch'] # "on" or "off"
        logging.info(column_received)
        logging.info(value_received)
        logging.info(switch_received)
        now = datetime.datetime.now() # Get current date and time from the user to log in the file for user study
        logging.info(str(now.hour)+':'+str(now.minute)+':'+str(now.second))
        filtered_data = data_dummy # Create a new dataframe to edit the values
        if value_received == 'all':
            unique_values = list(data[column_received].unique()) # Create a list of categories in the selected variable
            '''
            Notice that in this case, turning on/off a variable completely doesn't change the results. Turning on all features mean that we are adding that variable in the dataset.
            On the other hand, turning off a variable means that we don't count that variable in our calculations i.e. it is wildcarded. In this case, the variable remain in the dataset but is
            hidden from calculations. So, in both cases, the variable remains in the dataset.
            '''
            if switch_received == 'off':
                if column_received not in blacklist_cols:
                    blacklist_cols.append(column_received)
                for value in unique_values:
                    try:
                        on_cols.remove(column_received+'_'+value) # Remove all the categories from on_cols
                    except ValueError:
                        pass
                    if column_received+'_'+value not in off_cols: # Add all the categories to off_cols if not already present
                        off_cols.append(column_received+'_'+value)
                
            else:
                try:
                    blacklist_cols.remove(column_received)
                except ValueError:
                    pass
                for value in unique_values:
                    try:
                        off_cols.remove(column_received+'_'+value) # Remove the categories from off_cols
                    except ValueError:
                        pass
                    if column_received+'_'+value not in on_cols: # Add the categories to on_cols if not already present
                        on_cols.append(column_received+'_'+value)
        else:
            if switch_received == 'off': # Remove the selected bar from on_cols and add to off_cols list
                try:
                    on_cols.remove(column_received+'_'+value_received)
                except ValueError:
                    pass
                off_cols.append(column_received+'_'+value_received)
            else: # Add the bar to on_cols and remove from off_cols
                '''
                It is important to remove the blacklisted variable at this stage because if the user clicked a button for a variable to turn them off, then he again clicks on a single bar 
                for the same variable. In this case, the variable is back to scene and it is important to remove this column from blacklisted variables for proper
                functioning of the app.
                '''
                if column_received in blacklist_cols: # Remove the variable if it is blacklisted
                    blacklist_cols.remove(column_received)
                on_cols.append(column_received+'_'+value_received)
                off_cols.remove(column_received+'_'+value_received)
        
        data_tosend = getRequestedData(on_cols, off_cols, blacklist_cols, filtered_data, data_tosend, switch_received, value_received, column_received, dataframes, history_global, columns)
        
        return jsonify(data_tosend)
    else:
        print("here")
        history_global = [] # Empty the history global array because the system is refreshed
        filtered_data = data_dummy # Create a new dataframe to edit the values
        on_cols = list(column_dummy[1:]) # List of bars that are turned on. Initially, all the bars are on. We start from 1st index because column_dummy[0] = Throughput
        off_cols = [] # No bars are turned off initially    
        '''
        In the next step, a new dataframe is created storing the variable categories and 
        the Max and Min Throughput value for each category. This new dataframe is then 
        converted to a JSON dictionary and sent to the client.
        '''
        cur_variable = on_cols[0].split('_')[0] # Used to store the variable part of the string, for ex: Workload_Data is a string them cur_variable will store "Workload".
        global_temp_df = pd.DataFrame(columns=[cur_variable, 'IsPresent', 'Max', 'Min', '10', '25', '50', '75', '90', 'Mean', 'Data']) # Dataframe used to store the categories and their Max and Min Throughput values
        for col in on_cols: # For all the bars that are currently in the "on" state
            temp = filtered_data.loc[filtered_data[col] == 1] # Get the dataframe where the current category for a given variable is 1 i.e. 'on'. This is used to plot individual bars.
            temp_var = col.split('_')[0] # Get the variable part of the string
            temp_cat = col.split('_')[1] # Get the category part of the string
            if temp_var == cur_variable: # There is no change in the variable of the col
                global_temp_df = global_temp_df.append({temp_var: temp_cat, 
                                                        'IsPresent': 1, 
                                                        'Max': temp.Throughput.max(), 
                                                        'Min': temp.Throughput.min(), 
                                                        '10': temp.Throughput.quantile(0.1),
                                                        '25': temp.Throughput.quantile(0.25),
                                                        '50': temp.Throughput.quantile(0.5),
                                                        '75': temp.Throughput.quantile(0.75),
                                                        '90': temp.Throughput.quantile(0.9),
                                                        'Mean': temp.Throughput.mean(), 
                                                        'Data': list(temp.Throughput.sample(frac=0.2))}, ignore_index=True)
                # Append a row in the global_temp_df that includes the Min and Max, Lower Quantile, Upper Quantile and Median values for a new category of current variable
            else:
                '''
                Now we're ready to put the values of global_temp_df into dataframes dictionary. But before that, there's a user specification 
                that needs to be taken care of. In the dataset, some values were named 'none' which are to be displayed before any other category for 
                that variable. So, we bring the row containing 'none' as the category name to the top of the dataframe.

                Secondly, there are some categories that contain strings with numbers. For such categories, we need natural sorting instead of trivial 
                string. For example, For Inode Size containing {128, 512, 256, 1024, none}, the correct sorted order should be {none, 128, 256, 512, 1024}. But since, we read
                the categories as strings, the sorted order is produced to be {1024, 128, 256, 512, none}. To sort such strings correctly, we use 
                natural sorting along with explicitly adding 'none' to the start of the sorted dataframe.
                '''
                global_temp_df.set_index(list(global_temp_df.columns)[0], inplace=True) # Set the index of global_temp_df to the variable name, for example Workload, FileSystem etc.
                global_temp_df = global_temp_df.reindex(index=natsorted(global_temp_df.index)) # Sort the newly created index column based on natural sort
                global_temp_df['new'] = range(1,len(global_temp_df)+1) # Create a new column to give numbers to each of the rows in the dataframe
                if 'none' in global_temp_df.index: # If the current variable contains none, we need to bring that to the top of the dataframe
                    global_temp_df.at['none', 'new'] =  0 # Assign the number 0 to the row that contains none.
                    # Notice that we assigned numbers from range 1 to length of the dataframe to each row under 'new' column. 
                    # As we assign 'none' containing row a value 0, if we sort the dataframe with column 'new', 'none' will come on top automatically.
                global_temp_df = global_temp_df.sort_values('new').drop('new', axis=1) # Sort the dataframe based on values in 'new' column to bring 'none' on top
                global_temp_df.reset_index(inplace=True) # Reset the index
                dataframes[cur_variable] = global_temp_df # Add the value of current dataframe to the dataframes dict for storage
                
                # Code to create a JSON Object start -------------

                chart_df = global_temp_df.to_dict(orient='records') # Convert the dataframe to a dict
                chart_df = json.dumps(chart_df) # Create a JSON object
                data_tosend[cur_variable] = chart_df # Add the JSON object to JSON array which is sent to the client

                # JSON object code end here --------------
                cur_variable = temp_var # A new variable is detected, so change the value of cur_variable to the new variable
                '''
                IsPresent in the dataframe is used to remember which are the bars that are actually affected by the current configuration selection.
                IsPresent = 1 if a category's throughput changes based on current configuration selection, on the other hand
                IsPresent = 0 if a category disappears from the dataset based on current configuration. 

                For example: if the user selects {Workload: FileServer, SpecialOption: nodatasum}, in this case, many categories disappear as 
                they are not possible to occur in reality or they are not present in the dataset. In such case, the bars for these categories should disappear from the plot.

                IsPresent stores this information and is used in index.js to make the bars appear/disappear.
                '''
                temp_df = pd.DataFrame(columns=[temp_var, 'IsPresent', 'Max', 'Min', '10', '25', '50', '75', '90', 'Mean', 'Data']) # Create a new temporary dataframe because a new variable type is detected
                temp_df = temp_df.append({temp_var: temp_cat, 
                                        'IsPresent': 1, 
                                        'Max': temp.Throughput.max(), 
                                        'Min': temp.Throughput.min(), 
                                        '10': temp.Throughput.quantile(0.1),
                                        '25': temp.Throughput.quantile(0.25),
                                        '50': temp.Throughput.quantile(0.5),
                                        '75': temp.Throughput.quantile(0.75),
                                        '90': temp.Throughput.quantile(0.9),
                                        'Mean': temp.Throughput.mean(), 
                                        'Data': list(temp.Throughput.sample(frac=0.2))}, ignore_index=True)
                # Add the Max and Min throughput values to the temp dataframe for current category
                global_temp_df = temp_df # Change global_temp_df to this new dataframe for a new variable
                
        # At this point, global_temp_df contains the dataframe for the last variable in the dataset. We need to add this dataset to the JSON array data_tosend
        
        dataframes[cur_variable] = global_temp_df # Add the value of current dataframe to the dataframes dict for storage
        # Code to create a JSON Object start -------------

        chart_df = global_temp_df.to_dict(orient='records') # Convert the dataframe to a dict
        chart_df = json.dumps(chart_df) # Create a JSON object
        data_tosend[cur_variable] = chart_df # Add the JSON object to JSON array which is sent to the client

        # JSON object code end here --------------
        data_tosend['Max Thp'] = filtered_data.Throughput.max() # Max throughput of full data
        data_tosend['Min Thp'] = filtered_data.Throughput.min() # Min throughput of full data
        data_tosend['10 Thp'] = filtered_data.Throughput.quantile(0.1)
        data_tosend['25 Thp'] = filtered_data.Throughput.quantile(0.25)
        data_tosend['50 Thp'] = filtered_data.Throughput.quantile(0.5)
        data_tosend['75 Thp'] = filtered_data.Throughput.quantile(0.75)
        data_tosend['90 Thp'] = filtered_data.Throughput.quantile(0.9)
        data_tosend['Mean Thp'] = filtered_data.Throughput.mean()
        # pred_list = getPredictions(filtered_data, on_cols)
        # data_tosend['Pred List'] = pred_list
        # Sample the data to display on the frontend (This is to make the app run faster)
        if len(filtered_data.Throughput) > 10000:
            data_tosend['Data Thp'] = list(filtered_data.Throughput.sample(frac=0.2))
        else:
            data_tosend['Data Thp'] = list(filtered_data.Throughput)
        # History disctionary is added to history_global list to record a state change
        history_list = {"on_cols": list(on_cols), "off_cols": list(off_cols), "blacklist_cols": list(blacklist_cols), "Thp Max": filtered_data.Throughput.max(), "Thp Min": filtered_data.Throughput.min()}
        history_global.append(history_list)
        data_tosend['History'] = history_global
        return render_template('index.html', data=data_tosend)



if __name__=="__main__":
    '''
        This method is run only once when the server is started
    '''
    data = pd.read_csv('dataset/uploaded_file.csv') # Reading the dataset is done only once when the server is started
    columns = list(data.columns) # Crete a list of columns in the dataset
    for col in columns[:-1]: # For all columns except throughput
        data[col] = data[col].apply(str) # Change the datatype for each column to be of type string so that there are no conflicts when performing calculations on each of the columns
    data_dummy = pd.get_dummies(data) #Since all the data in categorical, this creates a boolean dummy dataframe by creating columns of all the categories for each variable. This creates a column for each bar displayed
    column_dummy = list(data_dummy.columns)
    on_cols = [] # List of bars that are turned on. Initially, all the bars are on. We start from 1st index because column_dummy[0] = Throughput
    off_cols = [] # No bars are turned off initially
    data_tosend = {'columns': columns[:-1]}
    data_tosend['Max Cols'] = len(column_dummy)-1 # Total number of bars to display i.e. all columns in the dummy dataframe except throughput
    dataframes = {} # This variable stores all variables in the dataset and the statistics of throughput for each of these variables. It is a dict of dataframes
    blacklist_cols = [] # It stores the variables for which the buttons are turned 'off'. 
    history_global = [] # List used to store on_cols, off_cols and blacklist_cols for each state. Used for blockchain plot
    app.run(debug=True)
    # app.run(host='0.0.0.0', threaded=True)

