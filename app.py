from flask import Flask, render_template, request, redirect, url_for
import folium
import os
import uuid

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        # Do something with the username and email
        # Redirect to the map selection page
        return redirect(url_for('map_selection'))

    return render_template('index.html')

@app.route('/map', methods=['GET', 'POST'])
@app.route('/map', methods=['GET', 'POST'])
def map_selection():
    if request.method == 'POST':
        map_selection = request.form['map']

        if map_selection not in ['map1', 'map2']:
            # Handle invalid selection, maybe return an error message
            return "Invalid map selection", 400

        # Redirect to the process_map page with the map selection as an argument
        return redirect(url_for('process_map', map_selection=map_selection))

    return render_template('map.html')


@app.route('/scores', methods=['GET'])
def scores():  
    # Render the scores page
    return render_template('scores.html')

@app.route('/process_map', methods=['GET'])
def process_map():
    map_selection = request.args.get('map_selection')

    return render_template('process_map.html')


if __name__ == '__main__':
    app.run(debug=True)
