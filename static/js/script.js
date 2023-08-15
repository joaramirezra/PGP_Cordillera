class JuegoDeMapas {
    static MAX_INTENTOS = 3;
    static JUEGO_TIEMPO = 30;
    static COLORES = ['#FFCC66', '#FF9900', '#FF0000'];
    static DEFAULT_STYLE = {
        color: '#003366',
        fillColor: '#6699CC',
        fillOpacity: 0.5,
        weight: 2,
        opacity: 1
    };

    constructor() {
        this.map = L.map('map').setView([4.6097, -74.0817], 6);
        this.puntuacion = 0;
        this.tiempo = JuegoDeMapas.JUEGO_TIEMPO;
        this.preguntaActual = null;
        this.intentos = 0;
        this.poligonos = [];

        this.initializeMapLayer();
        this.map.on('click', this.enClickMapa.bind(this));
        document.getElementById('startButton').addEventListener('click', this.iniciarJuego.bind(this));

        this.loadMapData();
    }

    initializeMapLayer() {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contribuyentes'
        }).addTo(this.map);
    }

    loadMapData() {
        fetch('static/maps/departments.geojson')
            .then(response => response.json())
            .then(data => {
                this.preguntas = data.features;
                this.mostrarTodasLasFormas();
            });
    }

    getPreguntaAleatoria() {
        const index = Math.floor(Math.random() * this.preguntas.length);
        const pregunta = this.preguntas[index];
        this.preguntas.splice(index, 1); // Remove the selected question
        return pregunta;
    }

    encontrarPoligonoClickeado(latlng) {
        return this.poligonos.find(poligono => this.isPointInPolygon(latlng, poligono));
    }
    
    isPointInPolygon(latlng, polygon) {
        return polygon.getBounds().contains(latlng) && turf.booleanPointInPolygon([latlng.lng, latlng.lat], polygon.feature.geometry);
    }

    enClickMapa(e) {
        if (!this.preguntaActual) return;
    
        const clickedPolygon = this.encontrarPoligonoClickeado(e.latlng);
    
        if (clickedPolygon) {
            if (clickedPolygon.feature === this.preguntaActual) {
                this.acierto(clickedPolygon);
            } else {
                this.error(clickedPolygon);
            }
        }
    }
    
    getTurfPolygon(pregunta) {
        if (pregunta.geometry.type === "Polygon") {
            return turf.polygon(pregunta.geometry.coordinates);
        }
        return turf.multiPolygon(pregunta.geometry.coordinates);
    }

    acierto(clickedPolygon) {
        this.cambiarColorForma(clickedPolygon, '#00FF00');
        this.puntuacion += 3 - this.intentos;
        this.actualizarPuntuacion();
        this.intentos = 0;
        this.siguientePregunta();
    }

    error(clickedPolygon) {
        this.cambiarColorForma(clickedPolygon, JuegoDeMapas.COLORES[this.intentos]);
        this.intentos++;
        if (this.intentos >= JuegoDeMapas.MAX_INTENTOS) {
            this.mostrarForma();
            this.intentos = 0;
            this.siguientePregunta();
        }
    }

    mostrarTodasLasFormas() {
        this.preguntas.forEach(pregunta => {
            const coordenadas = this.getCoordenadas(pregunta);
            const poligono = L.polygon(coordenadas, JuegoDeMapas.DEFAULT_STYLE).addTo(this.map);
            
            poligono.feature = pregunta;  // This is where you store the reference to the original feature
            
            this.poligonos.push(poligono);
            poligono.bindPopup(pregunta.properties.Nombre);
            poligono.on('click', (e) => {
                let newEvent = {
                    latlng: e.latlng
                };
                this.enClickMapa(newEvent);
            });
        });
    }
    
    getCoordenadas(pregunta) {
        const rawCoords = (pregunta.geometry.type === "Polygon") ?
            pregunta.geometry.coordinates[0] :
            pregunta.geometry.coordinates[0][0];
        return rawCoords.map(coord => [coord[1], coord[0]]);
    }

    mostrarForma() {
        const coordenadas = this.getCoordenadas(this.preguntaActual);
        this.poligonoActual = L.polygon(coordenadas).addTo(this.map);
    }

    cambiarColorForma(forma, color) {
        forma.setStyle({
            color: color,
            fillColor: color,
        });
    }

    limpiarPantalla() {
        this.poligonos.forEach(poligono => this.map.removeLayer(poligono));
        this.poligonos = [];
        if (this.poligonoActual) {
            this.map.removeLayer(this.poligonoActual);
            this.poligonoActual = null;
        }
    }

    finalizarJuego() {
        clearInterval(this.intervaloJuego);
        this.actualizarCoords("Juego Finalizado.");
        
        const inicioButton = document.getElementById('startButton');
        if (inicioButton) {
            inicioButton.style.display = 'none';
        }
        
        const userEmail = window.userEmail;
    
        // Send score to the server to save
        fetch('/game_finish', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `score=${this.puntuacion}&email=${userEmail}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                // If score saved successfully, redirect to the scores page with the score as a query parameter
                window.location.href = `/scores?score=${data.score}`;
            } else {
                console.error("Failed to save score");
            }
        });
    }
    
    iniciarJuego() {
        this.limpiarPantalla();
        this.mostrarTodasLasFormas();
        this.tiempo = JuegoDeMapas.JUEGO_TIEMPO;
        this.intentos = 0;
        this.lugaresPreguntados = 0;
        this.intervaloJuego = setInterval(this.tickJuego.bind(this), 1000);
        this.siguientePregunta();
    }

    siguientePregunta() {
        if (this.lugaresPreguntados >= 10) {
            this.finalizarJuego();
            return;
        }
        this.preguntaActual = this.getPreguntaAleatoria();
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
        const minutos = Math.floor(this.tiempo / 60);
        const segundos = this.tiempo % 60;
        document.getElementById('timer').textContent = "Tiempo Restante: " + minutos + ":" + (segundos < 10 ? '0' : '') + segundos;
    }

    tickJuego() {
        this.tiempo--;
        this.actualizarTiempo();
        if (this.tiempo <= 0) {
            this.finalizarJuego();
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
