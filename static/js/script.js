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
        this.poligonos = [];
        this.polygonPreguntaActual = null; 

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contribuyentes'
        }).addTo(this.map);
        
        this.map.on('click', this.enClickMapa.bind(this));
        document.getElementById('startButton').addEventListener('click', this.iniciarJuego.bind(this));
        
        fetch('static/maps/departments.geojson')
        .then(response => response.json())
        .then(data => {
            this.preguntas = data.features;
            this.mostrarTodasLasFormas(); // Display all shapes after they've been loaded.
        });
        this.getPreguntaAleatoria = this.getPreguntaAleatoria.bind(this);
        this.iniciarJuego = this.iniciarJuego.bind(this);
        this.enClickMapa = this.enClickMapa.bind(this);
    }

    getPreguntaAleatoria() {
        let departamento = this.preguntas[Math.floor(Math.random() * this.preguntas.length)];
        return departamento;
    }

    encontrarPoligonoClickeado(latlng) {
        for (let poligono of this.poligonos) {
            if (poligono.getBounds().contains(latlng)) {
                return poligono;
            }
        }
        return null;
    }
    enClickMapa(e) {
        if (!this.preguntaActual) {
            return;
        }
    
        let punto = turf.point([e.latlng.lng, e.latlng.lat]);
    
        let poligono;
        if (this.preguntaActual.geometry.type === "Polygon") {
            poligono = turf.polygon(this.preguntaActual.geometry.coordinates);
        } else if (this.preguntaActual.geometry.type === "MultiPolygon") {
            poligono = turf.multiPolygon(this.preguntaActual.geometry.coordinates);
        }
    
        const colors = ['#FFCC66', '#FF9900', '#FF0000'];  // Light Orange, Orange, Red
    
        const clickedPolygon = this.encontrarPoligonoClickeado(e.latlng);
    
        if (turf.booleanPointInPolygon(punto, poligono)) {
            if (clickedPolygon) {
                this.cambiarColorForma(clickedPolygon, '#00FF00');  // Green for correct guess
            }
    
            if (this.intentos === 0) {
                this.puntuacion += 3;
            } else if (this.intentos === 1) {
                this.puntuacion += 2;
            } else if (this.intentos === 2) {
                this.puntuacion += 1;
            }
    
            this.actualizarPuntuacion();
            this.actualizarCoords(e.latlng.toString());
            this.intentos = 0;
            this.siguientePregunta();  // Move to the next question
    
        } else {
            if (clickedPolygon && this.intentos < 3) {
                this.cambiarColorForma(clickedPolygon, colors[this.intentos]);
            }
    
            this.intentos++;
    
            if (this.intentos >= 3) {
                this.mostrarForma();
                this.intentos = 0;  // Reset the attempts
                this.siguientePregunta();  // Move to the next question
            }
        }
    }
    

    mostrarTodasLasFormas() {
        this.preguntas.forEach(pregunta => {
            let coordenadas;
            if (pregunta.geometry.type === "Polygon") {
                coordenadas = pregunta.geometry.coordinates[0];
            } else if (pregunta.geometry.type === "MultiPolygon") {
                coordenadas = pregunta.geometry.coordinates[0][0];
            }
    
            let options = {
                color: '#003366',      
                fillColor: '#6699CC',  
                fillOpacity: 0.5,      
                weight: 2,             
                opacity: 1             
            };
    
           let poligono = L.polygon(coordenadas.map(coord => [coord[1], coord[0]]), options).addTo(this.map);
            this.poligonos.push(poligono);  // Store the polygon
            poligono.bindPopup(pregunta.properties.Nombre);
    
            poligono.on('click', (e) => {
                let newEvent = {
                    latlng: e.latlng
                };
                this.enClickMapa(newEvent);
            });
        });
    }

    mostrarForma() {
        let coordenadas;
        if (this.preguntaActual.geometry.type === "Polygon") {
            coordenadas = this.preguntaActual.geometry.coordinates[0];
        } else if (this.preguntaActual.geometry.type === "MultiPolygon") {
            coordenadas = this.preguntaActual.geometry.coordinates[0][0];
        }
        
        this.poligonoActual = L.polygon(coordenadas.map(coord => [coord[1], coord[0]])).addTo(this.map);
    }

    cambiarColorForma(forma, color) {
        forma.setStyle({
            color: color,         // The color of the border
            fillColor: color,     // The fill color
        });
    }
    
    limpiarPantalla() {
        // Loop over the array of markers and remove each from the map
        this.marcadores.forEach(marker => {
            this.map.removeLayer(marker);
        });
        // Empty the array of markers
        this.marcadores = [];
        // Check if there is a polygon from the last question and remove it
        if (this.poligonoActual) {
            this.map.removeLayer(this.poligonoActual);
            this.poligonoActual = null;
        }
        this.poligonos.forEach(poligono => {
            this.map.removeLayer(poligono);
        });
        this.poligonos = [];
    }


    finalizarJuego() {
        // We'll not reset the score here to keep the accumulated score

        clearInterval(this.intervaloJuego);
        this.actualizarPuntuacion();
        this.actualizarCoords("Juego Finalizado.");
        let timeTaken = this.tiempo;  // Assuming you started with 30 seconds
         window.top.location.href = `/scores?score=${this.puntuacion}&time=${timeTaken}`;

    }

    iniciarJuego() {
        this.limpiarPantalla();
        this.mostrarTodasLasFormas();
        this.tiempo = 30;  // Giving 10 seconds for each of the 3 locations
        this.intentos = 0;
        this.lugaresPreguntados = 0;  // New variable to keep track of how many places we've asked
        this.intervaloJuego = setInterval(this.tickJuego.bind(this), 1000);
        this.siguientePregunta();  // New function to handle the next question
    }

    siguientePregunta() {
        if (this.lugaresPreguntados >= 3) {
            this.finalizarJuego();
            return;
        }

        this.preguntaActual = this.getPreguntaAleatoria();
        this.polygonPreguntaActual = this.poligonos.find(pol => pol.feature === this.preguntaActual);
        this.actualizarCoords('Haz clic en ' + this.preguntaActual.properties.Nombre);
        this.lugaresPreguntados++;
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
            this.finalizarJuego()
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
