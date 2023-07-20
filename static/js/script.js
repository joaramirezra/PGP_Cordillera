class MapGame {
    constructor() {
        this.map = L.map('map').setView([4.6097, -74.0817], 6);
        this.score = 0;
        this.timer = 30;
        this.gameInterval = null;
        this.currentQuestion = null;
        this.currentPolygon = null;
        this.currentMarker = null;  // New prop
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);
        
        this.map.on('click', this.onMapClick.bind(this));
        document.getElementById('startButton').addEventListener('click', this.startGame.bind(this));
        
        // Load the GeoJSON data.
        fetch('static/maps/departments.geojson')
            .then(response => response.json())
            .then(data => {
                this.questions = data.features;
            });
    }

    getRandomQuestion() {
        let department = this.questions[Math.floor(Math.random() * this.questions.length)];
        return department;
    }

    onMapClick(e) {
        let point = turf.point([e.latlng.lng, e.latlng.lat]);
    
        let polygon;
        if (this.currentQuestion.geometry.type === "Polygon") {
            polygon = turf.polygon(this.currentQuestion.geometry.coordinates);
        } else if (this.currentQuestion.geometry.type === "MultiPolygon") {
            polygon = turf.multiPolygon(this.currentQuestion.geometry.coordinates);
        }
    
        if (turf.booleanPointInPolygon(point, polygon)) {
            alert("Felicitaciones acertaste.");
            this.score++;
            this.updateScore();
            this.updateCoords(e.latlng.toString());
        }
        else {
            alert("Mas suerte para la proxima");
        }
        
        if (this.currentPolygon) {
            this.map.removeLayer(this.currentPolygon);
        }

        // Draw the current question's polygon on the map.
        let coordinates;
        if (this.currentQuestion.geometry.type === "Polygon") {
            coordinates = this.currentQuestion.geometry.coordinates[0];
        } else if (this.currentQuestion.geometry.type === "MultiPolygon") {
            coordinates = this.currentQuestion.geometry.coordinates[0][0];
        }
        this.currentPolygon = L.polygon(coordinates.map(coord => [coord[1], coord[0]])).addTo(this.map);
        if (this.currentMarker) {
            this.map.removeLayer(this.currentMarker);
        }

        // Add a marker at the clicked position.
        this.currentMarker = L.marker(e.latlng).addTo(this.map);
    }

    startGame() {
        if (this.questions === null) {
            setTimeout(() => this.startGame(), 1000);
            return;
        }
        if (this.gameInterval !== null) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        this.score = 0;
        this.timer = 30;
        this.gameInterval = setInterval(this.gameTick.bind(this), 1000);
        this.currentQuestion = this.getRandomQuestion();
        this.currentQuestion = this.getRandomQuestion();

        // Show the question in an alert window.
        alert('Where is ' + this.currentQuestion.properties.Nombre + '?');
    }

    updateScore() {
        document.getElementById('score').textContent = "High Score: " + this.score;
    }

    updateCoords(coords) {
        document.getElementById('coords').textContent = "Last Coordinates: " + coords;
    }

    updateTimer() {
        let minutes = Math.floor(this.timer / 60);
        let seconds = this.timer % 60;
        document.getElementById('timer').textContent = "Remaining Time: " + minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    }

    gameTick() {
        this.timer--;
        this.updateTimer();
        if(this.timer <= 0) {
            alert("Game Over! tu puntaje es: " + this.score);
            clearInterval(this.gameInterval);
            this.gameInterval = null;
            this.score = 0;
            this.updateScore();
            this.updateCoords("None");
            this.timer = 30;
        }
    }
}

new MapGame();

$(document).ready(function() {
    $(".map-image").click(function() {
        $("#map-selection-form input[name='map']").val(this.id);
        $("#map-selection-form").submit();
    });
});
