/*!
 *  Call when page is load, can be use to generate description, additional init and etc.
 */
function onload_handler() {
	document.getElementById("page_header").innerHTML = "<h3>Pin sorting</h3>"
	document.getElementById("description").innerHTML = `Place in textarea list of pin in format: <b>pin_number pin_name pin_description</b><br>
		Copy from right textarea sorted by group pins, or save into *.txt file.`		
} 

/*!
 * Parse raw input to pin number, pin name and pin description
 */
function parse_input(raw_text) {
	parsed_list=[]
	line_list=raw_text.split('\n')
	
	line_list.forEach(function(item, index) {
		temp = item.split(/\s+/);
		if(temp.length >= 3) parsed_list.push({id: temp[0], name: temp[1], info: temp.slice(2).join(' ')})
	});
	
	return parsed_list;
};

/*!
 * Sort pin by info field
 */
function sort_by_info(list){
	list.sort(function(a,b){
		if(a.info < b.info) { return -1; }
		if(a.info > b.info) { return 1; }
		return 0;
	});
	
	ret_text = `${list[0]["id"]} ${list[0]["name"]} ${list[0]["info"]}\r\n`
	for(i=1; i<list.length; i++){
		if(list[i-1]["info"] != list[i]["info"]) ret_text += "\r\n"
		ret_text += `${list[i]["id"]} ${list[i]["name"]} ${list[i]["info"]}\r\n`
	}
	
	return ret_text;
};

/*!
 * Sort pin by name field
 */
function sort_by_name(list){
	list.sort(function(a,b){
		if(a.name < b.name) { return -1; }
		if(a.name > b.name) { return 1; }
		return 0;
	});
	
	ret_text = `${list[0]["id"]} ${list[0]["name"]} ${list[0]["info"]}\r\n`
	for(i=1; i<list.length; i++){
		if(list[i-1]["name"] != list[i]["name"]) ret_text += "\r\n"
		ret_text += `${list[i]["id"]} ${list[i]["name"]} ${list[i]["info"]}\r\n`
	}
	
	return ret_text;
};

/*!
 *  Main process for build kicad symbol structure
 */
function process(){
	upd_poup_header();
	
	list = parse_input(document.getElementById("pin_list").value)
	res_ouput = ""
	
	if(document.getElementById("sort_by_info").checked)
		res_output = sort_by_info(list);
	else if(document.getElementById("sort_by_name").checked)
		res_output = sort_by_name(list);				
	
	document.getElementById("output").value = res_output;
};

/*!
 *  Update file name showen in popup window
 */
function  upd_poup_header() {
	document.getElementById("file_name").innerHTML = `pin_sorted.txt`;
};


/*!
 *  Save .kicad_sim file
 */
function save_file() {
	if(document.getElementById("output").value == "") {
		alert("Output is empty")
	} else {
		var a = document.createElement("a");
		a.href = window.URL.createObjectURL(new Blob([document.getElementById("output").value], {type: "text/plain"}));
		a.download = `${document.getElementById("file_name").innerHTML}`;
		a.click();
		alert("File is saved as ".concat(a.download))
	}
};
