from flask import Flask, render_template, request, redirect, url_for, jsonify, flash
import folium
import os
import uuid
from flask_sqlalchemy import SQLAlchemy
from flask import session


app = Flask(__name__)
app.secret_key = "secret_key"  # Needed for flashing messages

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mydatabase.db'  # SQLite DB path
db = SQLAlchemy(app)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), unique=True, nullable=False)
    max_score = db.Column(db.Integer, nullable=True)  # max_score is nullable for now

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']

        existing_user = User.query.filter_by(email=email).first()

        if existing_user:
            flash('¡Un usuario con ese email ya existe!', 'danger')
            return redirect(url_for('index'))

        new_user = User(name=username, email=email)
        db.session.add(new_user)
        db.session.commit()

        # Store the user's email in the session
        session['user_email'] = email

        #flash('User registered successfully!', 'success')
        return redirect(url_for('map_selection'))

    return render_template('index.html')


@app.route('/map', methods=['GET', 'POST'])
def map_selection():
    if request.method == 'POST':
        map_selection = request.form['map']

        if map_selection not in ['map1', 'map2']:
            flash('Invalid map selection!', 'danger')
            return redirect(url_for('map_selection'))

        return redirect(url_for('process_map', map_selection=map_selection))

    return render_template('map.html')

@app.route('/scores', methods=['GET'])
def scores():
    # Filter out users with null scores, order by max_score in descending, and limit to 10 results.
    users = User.query.filter(User.max_score.isnot(None)).order_by(User.max_score.desc()).limit(10).all()
    return render_template('scores.html', users=users)


@app.route('/api/scores', methods=['GET'])
def api_scores():
    users = User.query.all()
    return jsonify([{'name': user.name, 'email': user.email, 'max_score': user.max_score} for user in users])


@app.route('/game_finish', methods=['POST'])
def game_finish():
    score = request.form.get('score', type=int)
    email = request.form.get('email')
    
    user = User.query.filter_by(email=email).first()
    if user:
        if not user.max_score or score > user.max_score:
            user.max_score = score
            db.session.commit()
           # flash('New high score!', 'success')
        else:
            pass
            #flash('Score saved.', 'info')
    else:
        flash('User not found.', 'danger')
    
    return jsonify({"status": "success", "score": score})


@app.route('/process_map', methods=['GET'])
def process_map():
    map_selection = request.args.get('map_selection')
    user_email = session.get('user_email', '')  # Fetch email from session or default to an empty string
    return render_template('process_map.html', userEmail=user_email)


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
