export const displayMap = (locations) => {
    mapboxgl.accessToken = 'pk.eyJ1Ijoic291bHJlc3QiLCJhIjoiY2tiajljZXl3MG14bjMxcGoyNGlnbXB4OSJ9.FRkmSI07vQ24v-ksWuWQug';

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/soulrest/ckbj9to6k28qq1in1pkxl1120',
        scrollZoom: false
        // center: [-118.114454, 34.112309],
        // zoom: 3.5,
        // interactive: false
    });

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc => {
        // Create marker
        const el = document.createElement('div');
        el.className = 'marker';
        // Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates).addTo(map);
        // Add popup
        new mapboxgl.Popup({
            offset: 30
        })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
            .addTo(map);
        // Extend map bounds to include current location
        bounds.extend(loc.coordinates);
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });
};