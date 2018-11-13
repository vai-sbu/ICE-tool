import pandas as pd
import logging
logging.basicConfig(filename='error.log', level=logging.DEBUG)

def getPredictions(filtered_data):
    thp_sorted = filtered_data.sort_values(by='Throughput', ascending=False)
    logging.info(thp_sorted)