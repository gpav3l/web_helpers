/*!
 * Print out file content into input textarea
 */
function dispFile(contents) {
  document.getElementById('pin_list').innerHTML=contents
}

/*!
 * Catch file select
 */
function clickElem(elem) {
	var eventMouse = document.createEvent("MouseEvents")
	eventMouse.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
	elem.dispatchEvent(eventMouse)
}

/*!
 * Show open file dialog
 */
function openFile(func) {
	readFile = function(e) {
		var file = e.target.files[0];
		if (!file) {
			return;
		}
		var reader = new FileReader();
		reader.onload = function(e) {
			var contents = e.target.result;
			fileInput.func(contents)
			document.body.removeChild(fileInput)
		}
		reader.readAsText(file)
	}
	fileInput = document.createElement("input")
	fileInput.type='file'
	fileInput.accept='.txt'
	fileInput.style.display='none'
	fileInput.onchange=readFile
	fileInput.func=func
	document.body.appendChild(fileInput)
	clickElem(fileInput)
}

/*! 
 * Parse text to pin list
 */
function get_parsed_pins(raw_list){		
	sort_list = []
	sub_list = []
	func_name = "";
	
	lines = raw_list.split("\n")
	
	lines.forEach(function (item, index) {
		if(item.match(new RegExp('^\[\\t\\s\]*$')) | (item.match(func_name_regex) != null)) {
			if(sub_list.length != 0) { 
				sort_list.push({fname: func_name, pin_list: sub_list});
				sub_list = []
			}
		
			if(item.match(func_name_regex) != null) { 
				func_name = func_name_regex.exec(item)[1];
			} else {
				func_name = "";
			}				
		} else {
			if (item.match(pin_regex) != null) {
				pin_type = "passive"
				temp = pin_regex.exec(item)
				if(temp[3] !== undefined) pin_type = pin_types[temp[3]]
				sub_list.push({"index":temp[1], "label":temp[2], "type":pin_type})
			}
		}
	});
	
	if(sub_list.length != 0) sort_list.push({fname: func_name, pin_list: sub_list});
	
	return sort_list;
};

/*!
*  Generate symbol property
*/
function symbol_property_gen() {
	sym_prop = [{prop: "Reference", value: document.getElementById("symbol_ref").value, pos_x: -19.05, pos_y: 7.62, font: 2},
	{prop: "Value", value: document.getElementById("symbol_name").value, pos_x: -2.54, pos_y: 7.62, font: 2},
	{prop: "Footprint", value: "", pos_x: 20.32, pos_y: 7.62, font: 2},
	{prop: "Datasheet", value: document.getElementById("symbol_ds").value, pos_x: -2.54, pos_y: 21.59, font: 1.27},
	{prop: "ki_locked", value: "", pos_x: 0, pos_y: 0, font: 1.27},
	{prop: "ki_keywords", value: "", pos_x: 0, pos_y: 0, font: 1.27},
	{prop: "ki_description", value: document.getElementById("symbol_desc").value, pos_x: 0, pos_y: 0, font: 1.27},
	]
	
	return_text = "";
	sym_prop.forEach(function (item, index) {
		return_text += `(property "${item["prop"]}" "${item["value"]}" (id ${index}) `;
		return_text += `(at ${item["pos_x"]} ${item["pos_y"]} 0) `;
		return_text += `(effects (font (size ${item["font"]} ${item["font"]}))))\r\n`
	});
	
	return return_text;
}

/*!
 *	Check pin to duplicate
 */
function is_id_duplicate(pins_list) {
	result = "";
	id_dict = {};
	pins_list.forEach(function(list) {
		list["pin_list"].forEach(function(item) {
			if(id_dict[item["index"]] === undefined) id_dict[item["index"]]= "1";
			else result = item["index"];
		});
	});
	return result;
}

/*!
 *  Main process for build kicad symbol structure
 */
function process(){
	pins_groups = get_parsed_pins(document.getElementById("pin_list").value);
	symbl_name = document.getElementById("symbol_name").value;
	is_gnd_concate = document.getElementById("is_gnd_concate").checked;
	
	if((dupl_id = is_id_duplicate(pins_groups)) != "") {
		document.getElementById("output").value = "";
		alert("Found duplicated pins id: " + dupl_id);
		return;
	}
	// Symbol header
	symbol_text	= `(symbol "${symbl_name}" (pin_numbers hide) (pin_names hide) (in_bom yes) (on_board yes)\r\n`
	
	symbol_text	+= symbol_property_gen();
	
	// Unit generation
	pins_groups.forEach(function(pins, index) {
		show_pin_count = 0
		first_grp_pin = {}
		/* Text and pins generation */
		symbol_pins =`(symbol "${symbl_name}_${index+1}_1"\r\n`
		
		// Pin and name field
		pos_y = y_init
		pins["pin_list"].forEach(function(item) {
			pin_name = item["label"].toUpperCase()
			if(is_gnd_concate & /\S*GND\S*/.test(pin_name)) {
				if(first_grp_pin[pin_name] === undefined) {
					first_grp_pin[pin_name] = pos_y;
				}else {
					temp_y = first_grp_pin[pin_name].toFixed(3)
					symbol_pins += `(pin  ${item["type"]} line (at 15.24 ${temp_y} 180) (length 5.08) hide`
					symbol_pins += `(name "${item["label"]}" (effects (font (size 1.27 1.27)))) `
					symbol_pins += `(number "${item["index"]}" (effects (font (size 1.27 1.27)))))\r\n`
					return;		
				}
			}
			symbol_pins += `(text "${item["index"]}" (at 4.826 ${pos_y.toFixed(3)} 0)(effects (font (size 2 2))))\r\n`
			symbol_pins += `(text "${item["label"]}" (at -8.89 ${pos_y.toFixed(3)} 0)(effects (font (size 2 2))))\r\n`
			symbol_pins += `(pin ${item["type"]} line (at 15.24 ${pos_y.toFixed(3)} 180) (length 5.08) `
			symbol_pins += `(name "${item["label"]}" (effects (font (size 1.27 1.27)))) `
			symbol_pins += `(number "${item["index"]}" (effects (font (size 1.27 1.27)))))\r\n`		
			pos_y += y_step;
			show_pin_count++;				
		});
		
		symbol_pins += "(text \"Цепь\" (at -10.16 2.54 0)(effects (font (size 2 2))))\r\n"
		if(pins["fname"] != "") {
			symbol_pins += `(text "${pins["fname"]}" (at -3.81 ${show_pin_count*y_step+y_init} 0)(effects (font (size 2.0066 2.0066))))\r\n`
		}
		
		/* Lines generation */
		symbol_lines = `(symbol "${symbl_name}_${index+1}_0"\r\n`
		symbol_lines += `(rectangle (start -20.32 5.08) (end 10.16 ${y_step*show_pin_count}) (stroke (width 0) (type default) (color 0 0 0 0))(fill (type none)))\r\n`
		
		for (i=0; ; i+=y_step) { 
			symbol_lines += `(polyline (pts(xy -20.32 ${i}) (xy 10.16 ${i.toFixed(3)})) (stroke (width 0) (type default) (color 0 0 0 0))(fill (type none)))\r\n`
			if(i <= y_step*(show_pin_count-1))
				break;
		}
		symbol_lines +=`(polyline (pts(xy 0 5.08) (xy 0 ${y_step*show_pin_count})) (stroke (width 0) (type default) (color 0 0 0 0))(fill (type none))))\r\n`
		
		symbol_text += symbol_lines + symbol_pins + ")\r\n";
	});
	document.getElementById("output").value = symbol_text + ")";
	//location.href = "#popup_result";
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
		a.download = `${document.getElementById("symbol_name").value}.kicad_sym`;
		a.click();
	}
};
