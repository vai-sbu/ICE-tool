import os
import sys

activate_this = '/mnt/c/Users/atyag/Documents/boxPlotApp/env/bin/activate_this.py'
with open(activate_this) as file_:
    exec(file_.read(), dict(__file__=activate_this))

sys.stdout = sys.stderr

sys.path.insert(0, os.path.join(os.path.dirname(os.path.realpath(__file__)),'../..'))

sys.path.append('/mnt/c/Users/atyag/Documents/boxPlotApp/')

from boxPlotApp.app import app as application
