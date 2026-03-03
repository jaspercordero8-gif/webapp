// MVP VERSION – Only Map, Routing, Directions, ETA

class UrbanNavApp {
    constructor() {
        this.map = null;
        this.directionsService = null;
        this.directionsRenderer = null;
        this.selectedMode = "DRIVING";
        this.waitForGoogleMaps();
    }

    waitForGoogleMaps() {
        if (typeof google !== 'undefined' && google.maps) {
            this.initMap();
            this.initEventListeners();
        } else {
            setTimeout(() => this.waitForGoogleMaps(), 100);
        }
    }

    initMap() {
        this.map = new google.maps.Map(document.getElementById("map"), {
            center: CONFIG.DEFAULT_CENTER,
            zoom: 12
        });

        this.directionsService = new google.maps.DirectionsService();
        this.directionsRenderer = new google.maps.DirectionsRenderer({ map: this.map });

        new google.maps.places.Autocomplete(document.getElementById('fromInput'));
        new google.maps.places.Autocomplete(document.getElementById('toInput'));
    }

    initEventListeners() {
        document.getElementById("findRouteBtn")
            .addEventListener("click", () => this.findRoute());
    }

    async findRoute() {
        const from = document.getElementById("fromInput").value;
        const to = document.getElementById("toInput").value;

        if (!from || !to) {
            this.showError("routeInfo", "Please enter both start and destination.");
            return;
        }

        this.showLoading("routeInfo", "Finding route…");

        try {
            document.getElementById("transportModes").style.display = "block";
            document.getElementById("routeDetails").style.display = "block";

            this.showLoading("routeInfo", "Select a transport mode to continue.");
        } catch {
            this.showError("routeInfo", "Could not prepare route.");
        }
    }

    async selectMode(mode) {
        this.selectedMode = mode;

        const from = document.getElementById("fromInput").value;
        const to = document.getElementById("toInput").value;

        this.showLoading("routeInfo", "Calculating route…");

        try {
            const route = await this.calculateRoute(from, to, mode);
            this.directionsRenderer.setDirections(route);
            this.displayRouteDetails(route);
        } catch (err) {
            this.showError("routeInfo", err.message);
        }
    }

    calculateRoute(origin, destination, mode) {
        return new Promise((resolve, reject) => {
            this.directionsService.route(
                {
                    origin,
                    destination,
                    travelMode: google.maps.TravelMode[mode]
                },
                (result, status) => {
                    if (status === "OK") resolve(result);
                    else reject(new Error("Route calculation failed: " + status));
                }
            );
        });
    }

    displayRouteDetails(result) {
        const leg = result.routes[0].legs[0];

        document.getElementById("routeInfo").innerHTML = `
            <div class="route-summary-card">
                <div>
                    <div class="route-time">${leg.duration.text}</div>
                    <div class="route-distance">${leg.distance.text}</div>
                </div>
            </div>

            <p class="steps-heading">Step-by-step directions</p>
            <div class="steps-list">
            ${leg.steps.map((step, i) => `
                <div class="step-item">
                    <div class="step-number">${i + 1}</div>
                    <div class="step-body">
                        <div class="step-text">${step.instructions}</div>
                        <div class="step-meta">${step.distance.text} · ${step.duration.text}</div>
                    </div>
                </div>
            `).join("")}
            </div>
        `;
    }

    showLoading(elementId, message) {
        document.getElementById(elementId).innerHTML = `
            <div class="loading-row">
                <div class="spinner"></div>
                <span>${message}</span>
            </div>
        `;
    }

    showError(elementId, message) {
        document.getElementById(elementId).innerHTML = `
            <div class="alert-error">
                <p class="title">⚠️ Error</p>
                <p class="body">${message}</p>
            </div>
        `;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.app = new UrbanNavApp();
});
