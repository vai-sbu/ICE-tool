# ICE-tool
An Interactive Configuration Explorer to analyze categorical datasets. 

ICE paper is available at this [link](http://www3.cs.stonybrook.edu/~mueller/papers/ICE_paper_Camera_ready.pdf)

Video preview is available [here](https://www.youtube.com/watch?v=0mD3IEjjq0U&feature=youtu.be)

# Run ICE locally

* Clone this repo

* Set up the virtual env in python 3 ```$ virtualenv --python=/usr/bin/python3 env```
 
* Start the virtualenv ```$ source ./env/bin/activate```

* Install dependencies ```env$ pip install -r requirements.txt```

* Run ```python app.py```

* The ICE can now be accessed at ```localhost://5000```

# Before uploading your custom dataset, please note

* If you get a **KeyError not in index**, it means you'll have to remove special characters like underscores, starting spaces etc. from the column names of the dataset. 

* Remember, the last column of the uploaded dataset has to be the dependent numerical variable. Just move the numerical variable to the end of all the columns. 

* Presently, ICE only supports analysis of one numerical variable (last variable in the uploaded dataset). In case you want to analyze multiple numerical variables, you'll have to combine them into one numerical variable (take weighted mean, average etc.)

# Citation 
