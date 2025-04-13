sfomuseum.golang.wasm.fetch("wasm/point_in_polygon.wasm").then((rsp) => {
    
    const data_el = document.getElementById("data");
    const submit_el = document.getElementById("submit");
    const results_el = document.getElementById("results");
    const feedback_el = document.getElementById("feedback");    
    
    const lat_el = document.getElementById("latitude");
    const lon_el = document.getElementById("longitude");    

    const default_lat = 37.786995;
    const default_lon = -122.415500;

    const draw_results = function(data){
	
	const places = data.places;
	const count = places.length;
	
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
	}
	
	table.appendChild(tbody);
	
	results_el.innerHTML = "";
	results_el.appendChild(table);
	
    };
    
    submit_el.onclick = function(e){

	var lat = parseFloat(lat_el.value);
	var lon = parseFloat(lon_el.value);

	var geom = {
	    type: "Point",
	    coordinates: [ lon, lat ]
	};

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
	    
	    const data = JSON.parse(rsp);
	    draw_results(data);
	    
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
