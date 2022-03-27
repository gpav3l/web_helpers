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
	list = parse_input(document.getElementById("pin_list").value)
	res_ouput = ""
	
	if(document.getElementById("sort_by_info").checked)
		res_output = sort_by_info(list);
	else if(document.getElementById("sort_by_name").checked)
		res_output = sort_by_name(list);				
	
	document.getElementById("output").value = res_output;
};

/*!
 *  Save sorted pin to file
 */
function save_file() {
	if(document.getElementById("output").value == "") {
		alert("Output is empty")
	} else {
		var a = document.createElement("a");
		a.href = window.URL.createObjectURL(new Blob([document.getElementById("output").value], {type: "text/plain"}));
		a.download = `pin_sorted.txt`;
		a.click();
	}
};
