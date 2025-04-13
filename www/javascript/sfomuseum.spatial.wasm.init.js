sfomuseum.golang.wasm.fetch("wasm/point_in_polygon.wasm").then((rsp) => {
    
    const data_el = document.getElementById("data");
    const submit_el = document.getElementById("submit");
    const results_el = document.getElementById("results");
    const feedback_el = document.getElementById("feedback");    
    
    const lat_el = document.getElementById("latitude");
    const lon_el = document.getElementById("longitude");    

    // Keep a (global) copy of the source point-in-polygon data which will be used to
    // render geometries for matching places below in `draw_results`
    
    var source_data;
    
    const default_lat = 37.786995;
    const default_lon = -122.415500;

    const draw_results = function(source_data, response_data){

	var features_lookup = {};
	var map_features = [];
	
	const places = response_data.places;
	const count = places.length;

	if (count > 0){

	    var count_features = source_data.features.length;
	    
	    for (var i=0; i < count; i++){

		const f = source_data.features[i];
		const props = f.properties;
		const wof_id = props["wof:id"];
		
		features_lookup[ wof_id] = f;

		console.debug("Store feature", wof_id, f);		
	    }
	}
	
	var table = document.createElement("table");
	table.setAttribute("class", "table table-striped");
	
	var thead = document.createElement("thead");
	var tr = document.createElement("tr");
	
	var id_col = document.createElement("th");
	id_col.appendChild(document.createTextNode("ID"));
		
	var placetype_col = document.createElement("th");
	placetype_col.appendChild(document.createTextNode("Placetype"));

	var name_col = document.createElement("th");
	name_col.appendChild(document.createTextNode("Name"));
	
	tr.appendChild(id_col);
	tr.appendChild(placetype_col);	    	
	tr.appendChild(name_col);
	
	thead.appendChild(tr);
	table.appendChild(thead);
	
	var tbody = document.createElement("tbody");
	
	for (var i=0; i < count; i++){

	    var tr = document.createElement("tr");

	    var id_col = document.createElement("td");
	    id_col.appendChild(document.createTextNode(places[i]["wof:id"]));

	    var placetype_col = document.createElement("td");
	    placetype_col.appendChild(document.createTextNode(places[i]["wof:placetype"]));
	    
	    var name_col = document.createElement("td");
	    name_col.appendChild(document.createTextNode(places[i]["wof:name"]));
	    
	    tr.appendChild(id_col);
	    tr.appendChild(placetype_col);	    
	    tr.appendChild(name_col);
	    
	    tbody.appendChild(tr);

	    const wof_id = places[i]["wof:id"];
	    const f = features_lookup[ wof_id ];

	    if (! f){
		console.warn("Missing feature data for WOF ID, skipping", wof_id);
		continue
	    }
	    
	    console.debug("Add feature", wof_id, f);
	    map_features.push(f);
	}
	
	table.appendChild(tbody);
	
	results_el.innerHTML = "";
	results_el.appendChild(table);

	if (! map_features.length){
	    return;
	}
	
	const map_fc = {
	    type: "FeatureCollection",
	    features: map_features,
	};

	var bbox = whosonfirst.geojson.derive_bbox(map_fc);
	var bounds = [
	    [ bbox[1], bbox[0] ],
	    [ bbox[3], bbox[2] ],	    
	];
	
	var map_el = document.createElement("div");
	map_el.setAttribute("id", "map");

	results_el.appendChild(map_el);

	if (map_features.length < count){

	    var div = document.createElement("div");
	    div.setAttribute("style", "font-size:small; font-style:italic;");

	    div.appendChild(document.createTextNode("Some ancestor features not displayed because they are not contained in the source point-in-polygon data."));
	    results_el.append(div);
	}
	
	
	var map = L.map("map");
	map.fitBounds(bounds);

	var osm_layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
	osm_layer.addTo(map);
	
	var feature_layer = L.geoJSON(map_fc);
	feature_layer.addTo(map);

	var lat = parseFloat(lat_el.value);
	var lon = parseFloat(lon_el.value);

	var popup = L.popup();
	popup.setLatLng([lat, lon]);
	popup.setContent("You are here")
	popup.openOn(map);
	
    };
    
    submit_el.onclick = function(e){

	var lat = parseFloat(lat_el.value);
	var lon = parseFloat(lon_el.value);

	var geom = {
	    type: "Point",
	    coordinates: [ lon, lat ]
	};

	// Note: Default data sourced from whosonfirst/go-whosonfirst-spatial-duckdb
	// example which sources Parquet data from Geocode.earth which doesn't publish
	// existential flags (is_current, etc.) so specifying them here (with default
	// data) will yield 0 results.
	
	var q = {
	    geometry: geom,
	    sort: [
		"placetype://"
	    ]
	};

	var data = data_el.value;

	try {
	    var parsed = JSON.parse(data);
	    data = JSON.stringify(parsed);
	} catch (err){
	    feedback_el.innerText = "Invalid point-in-polygon data.";
	    console.error("Invalid data", err);
	}

	const str_q = JSON.stringify(q);

	feedback_el.innerText = "Perform point-in-polygon query.";
	
	point_in_polygon(data, str_q).then((rsp) => {

	    feedback_el.innerText = "Perform point-in-polygon successful.";
	    
	    const rsp_data = JSON.parse(rsp);
	    draw_results(source_data, rsp_data);
	    
	}).catch((err) => {
	    feedback_el.innerText = "Failed to perform point-in-polygon query";	    
	    console.error("Failed to perform point in polygon operation", err)
	});
	
	return false;
    };

    feedback_el.innerText = "Point in polygon WASM binary loaded.";
    feedback_el.innerText = "Fetching default point-in-polygon data.";
    
    fetch("/javascript/14-2620-6332.geojson").then(rsp =>
	rsp.json()
    ).then((data) => {

	source_data = data;
	
	data_el.value = JSON.stringify(data, null, 2);
	lat_el.value = default_lat;
	lon_el.value = default_lon;
	
	submit_el.removeAttribute("disabled");

	feedback_el.innerText = "Ready to query.";
	
    }).catch((err) => {
	feedback_el.innerText = "Failed to retrieve default point-in-polygon data.";	
	console.error("Failed to load data", err);
    });
    
}).catch((err) => {
    feedback_el.innerText = "Failed to load point-in-polygon WASM binary.";	    
    console.error("Failed to load point-in-polygon WASM binary", err);
    return;
});
