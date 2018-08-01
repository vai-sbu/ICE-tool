import json

from flask import Flask, render_template, request, redirect, Response
import pandas as pd

app = Flask(__name__)

@app.route('/bar', methods = ['POST'])
def bar_worker():
    column_received = request.form['column']
    value_received = request.form['value']
    switch_received = request.form['switch']
    print(switch_received)
    print(value_received)
    return 'OK'

@app.route('/button', methods = ['POST'])
def button_worker():
    column_received = request.form['column']
    switch_received = request.form['switch']
    print(switch_received)
    print(column_received)
    return 'OK'

@app.route("/")
def index():
    data = pd.read_csv('dataset/systems_data.csv')
    columns = list(data.columns)
    data_tosend = {'columns': columns[:-1]}
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
        max_thp = max(max_thp, chart_df['Max'].max())
        min_thp = min(min_thp, chart_df['Min'].min())
        chart_df.columns = chart_df.columns.droplevel(1)
        max_cols = max(max_cols, chart_df.shape[0])
        chart_df = chart_df.to_dict(orient='records')
        chart_df = json.dumps(chart_df)
        data_tosend[col] = chart_df
    data_tosend['Max Cols'] = max_cols
    data_tosend['Max Thp'] = max_thp
    data_tosend['Min Thp'] = min_thp
    return render_template("index.html", data=data_tosend)


if __name__ == "__main__":
    app.run(debug=True)