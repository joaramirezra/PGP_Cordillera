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
def map_selection():
    if request.method == 'POST':
        map_selection = request.form['map']
        map_center = None

        if map_selection == 'map1':
            map_center = [51.5074, -0.1278]  # London, UK
        elif map_selection == 'map2':
            map_center = [35.8617, 104.1954]  # China
        elif map_selection == 'map3':
            map_center = [4.7110, -74.0721]  # Colombia

        if map_center is not None:
            m = folium.Map(location=map_center, zoom_start=5)
            folium.Marker(location=map_center, popup='Selected Location').add_to(m)

            # Generate a unique filename for the map
            map_filename = 'map_{}.html'.format(uuid.uuid4())
            map_file_path = os.path.join('static', map_filename)

            # Save the map to a file
            m.save(map_file_path)

            # Redirect to the map processing page
            return redirect(url_for('process_map', map_filename=map_filename, map_selection=map_selection))

    return render_template('map.html')

@app.route('/process_map', methods=['GET'])
def process_map():
    map_filename = request.args.get('map_filename')
    map_selection = request.args.get('map_selection')

    return render_template('process_map.html', map_filename=map_filename, map_selection=map_selection)


if __name__ == '__main__':
    app.run(debug=True)

