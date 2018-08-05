import json

from flask import Flask, render_template, request, redirect, Response, jsonify
import pandas as pd

app = Flask(__name__)

def calculations(filtered_data):
    max_cols = 0
    min_thp = 10000000000000000
    max_thp = 0
    for col in columns[:-1]:
        col_thp = [col]
        col_thp.append('Throughput')
        df_grouped = pd.DataFrame(filtered_data[col_thp].groupby(col).describe()).reset_index()
        df_grouped['Max'] = df_grouped[('Throughput', 'max')]
        df_grouped['Min'] = df_grouped[('Throughput', 'min')]
        new_chart_df = df_grouped[[col, 'Max', 'Min']]
        new_chart_df.columns = new_chart_df.columns.droplevel(1)
        chart_df = dataframes[col]
        chart_df.loc[chart_df[col].isin(new_chart_df[col]), ['Max','Min']] = new_chart_df[['Max','Min']]
        max_thp = max(max_thp, chart_df['Max'].max())
        min_thp = min(min_thp, chart_df['Min'].min())
        max_cols = max(max_cols, chart_df.shape[0])
        chart_df = chart_df.to_dict(orient='records')
        chart_df = json.dumps(chart_df)
        data_tosend[col] = chart_df
    data_tosend['Max Cols'] = max_cols
    data_tosend['Max Thp'] = max_thp
    data_tosend['Min Thp'] = min_thp

    
# @app.route('/button', methods = ['POST', 'GET'])
# def button_worker():
#     column_received = request.form['column']
#     switch_received = request.form['switch']
#     print(switch_received)
#     print(column_received)
#     return 'OK'
    
@app.route("/", methods = ['POST', 'GET'])
def index():
    if request.method == 'POST':
        column_received = request.form['column']
        value_received = request.form['value']
        switch_received = request.form['switch']
        print(column_received)
        print(value_received)
        print(switch_received)
        filtered_data = data
        # Modifying the values based on selected bars
        
        if switch_received == 'off':
            unique_values[column_received].remove(value_received)
        else:
            unique_values[column_received].append(value_received)
        
        for item in columns[:-1]:
            filtered_data = filtered_data[filtered_data[item].isin(unique_values[item])]
        calculations(filtered_data)
        return jsonify(data_tosend)
    else:
        for item in columns[:-1]:
            unique_items = list(data[item].unique())
            unique_values[item] = unique_items
        
        max_cols = 0
        min_thp = 10000000000000000
        max_thp = 0
        for col in columns[:-1]:
            col_thp = [col]
            col_thp.append('Throughput')
            df_grouped = pd.DataFrame(data[col_thp].groupby(col).describe()).reset_index()
            df_grouped['Max'] = df_grouped[('Throughput', 'max')]
            df_grouped['Min'] = df_grouped[('Throughput', 'min')]
            chart_df = df_grouped[[col, 'Max', 'Min']]
            dataframes[col] = chart_df
            max_thp = max(max_thp, chart_df['Max'].max())
            min_thp = min(min_thp, chart_df['Min'].min())
            chart_df.columns = chart_df.columns.droplevel(1)
            max_cols = max_cols+chart_df.shape[0]
            chart_df = chart_df.to_dict(orient='records')
            chart_df = json.dumps(chart_df)
            data_tosend[col] = chart_df
        data_tosend['Max Cols'] = max_cols
        data_tosend['Max Thp'] = max_thp
        data_tosend['Min Thp'] = min_thp
        return render_template("index.html", data=data_tosend)


if __name__ == "__main__":
    data = pd.read_csv('dataset/systems_data.csv')
    columns = list(data.columns)
    data_tosend = {'columns': columns[:-1]}
    # Store the dataframes in a dictionary
    dataframes = {}
    # Calculating unique values in each column
    unique_values = {}
    for item in columns[:-1]:
        unique_items = list(data[item].unique())
        unique_values[item] = unique_items
    
    
    app.run(debug=True)