class JuegoDeMapas {
    constructor() {
        this.map = L.map('map').setView([4.6097, -74.0817], 6);
        this.puntuacion = 0;
        this.tiempo = 30;
        this.intervaloJuego = null;
        this.preguntaActual = null;
        this.poligonoActual = null;
        this.marcadorActual = null; 
        this.intentos = 0;  
        this.marcadores = [];  // New property to store the markers
        // ...
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contribuyentes'
        }).addTo(this.map);
        
        this.map.on('click', this.enClickMapa.bind(this));
        document.getElementById('startButton').addEventListener('click', this.iniciarJuego.bind(this));
        
        // Cargar los datos GeoJSON.
        fetch('static/maps/departments.geojson')
            .then(response => response.json())
            .then(data => {
                this.preguntas = data.features;
            });
    }

    getPreguntaAleatoria() {
        let departamento = this.preguntas[Math.floor(Math.random() * this.preguntas.length)];
        return departamento;
    }

    enClickMapa(e) {
        let punto = turf.point([e.latlng.lng, e.latlng.lat]);
    
        let poligono;
        if (this.preguntaActual.geometry.type === "Polygon") {
            poligono = turf.polygon(this.preguntaActual.geometry.coordinates);
        } else if (this.preguntaActual.geometry.type === "MultiPolygon") {
            poligono = turf.multiPolygon(this.preguntaActual.geometry.coordinates);
        }
    
        if (turf.booleanPointInPolygon(punto, poligono)) {
            alert("Felicitaciones, acertaste.");
            // Update the score based on the number of attempts.
            if (this.intentos === 0) {
                this.puntuacion += 3;
            } else if (this.intentos === 1) {
                this.puntuacion += 2;
            } else if (this.intentos === 2) {
                this.puntuacion += 1;
            }
            this.actualizarPuntuacion();
            this.actualizarCoords(e.latlng.toString());
            // Reset the number of attempts for the next question.
            this.intentos = 0;
        }
        else {
            alert("Más suerte para la próxima");
            this.intentos++;
        }
        
        // Add a marker at the clicked position.
        let marcador = L.marker(e.latlng).addTo(this.map);
        this.marcadores.push(marcador);  // Store the marker

        // If the user has made 3 attempts, show the shape and end the game.
        if (this.intentos >= 3) {
            this.mostrarForma();
            this.finalizarJuego();
        }
    }

    mostrarForma() {
        // Draw the current question's polygon on the map.
        let coordenadas;
        if (this.preguntaActual.geometry.type === "Polygon") {
            coordenadas = this.preguntaActual.geometry.coordinates[0];
        } else if (this.preguntaActual.geometry.type === "MultiPolygon") {
            coordenadas = this.preguntaActual.geometry.coordinates[0][0];
        }
        this.poligonoActual = L.polygon(coordenadas.map(coord => [coord[1], coord[0]])).addTo(this.map);
    }

    finalizarJuego() {
        alert("¡Juego Terminado! Tu puntuación es: " + this.puntuacion);
        clearInterval(this.intervaloJuego);
        this.intervaloJuego = null;
        this.puntuacion = 0;
        this.actualizarPuntuacion();
        this.actualizarCoords("¿Quieres empezar de nuevo? Haz clic en Iniciar.");
        this.tiempo = 30;
        this.intentos = 0;
    }
    iniciarJuego() {
        if (this.preguntas === null) {
            setTimeout(() => this.iniciarJuego(), 1000);
            return;
        }
        if (this.intervaloJuego !== null) {
            clearInterval(this.intervaloJuego);
            this.intervaloJuego = null;
        }
        this.puntuacion = 0;
        this.tiempo = 30;
        this.intervaloJuego = setInterval(this.tickJuego.bind(this), 1000);
        this.preguntaActual = this.getPreguntaAleatoria();
        this.preguntaActual = this.getPreguntaAleatoria();
    
        // Show the question in an alert window.
        alert('¿Dónde está ' + this.preguntaActual.properties.Nombre + '?');
    
        // Update the coords element with the coordinates of the current question.
        this.actualizarCoords('¿Dónde está ' + this.preguntaActual.properties.Nombre + '?');
    }

    actualizarPuntuacion() {
        document.getElementById('score').textContent = "Puntuación Máxima: " + this.puntuacion;
    }

    actualizarCoords(coords) {
        document.getElementById('coords').textContent = coords;
    }

    actualizarTiempo() {
        let minutos = Math.floor(this.tiempo / 60);
        let segundos = this.tiempo % 60;
        document.getElementById('timer').textContent = "Tiempo Restante: " + minutos + ":" + (segundos < 10 ? '0' : '') + segundos;
    }

    tickJuego() {
        this.tiempo--;
        this.actualizarTiempo();
        if(this.tiempo <= 0) {
            alert("¡Juego Terminado! Tu puntuación es: " + this.puntuacion);
            clearInterval(this.intervaloJuego);
            this.intervaloJuego = null;
            this.puntuacion = 0;
            this.actualizarPuntuacion();
            this.actualizarCoords("");
            this.tiempo = 30;
        }
    }
}

new JuegoDeMapas();

$(document).ready(function() {
    $(".map-image").click(function() {
        $("#map-selection-form input[name='map']").val(this.id);
        $("#map-selection-form").submit();
    });
});
