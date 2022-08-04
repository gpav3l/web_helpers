const pin_regex = new RegExp('^\[\\t\\s\]*(\\S+)\[\\t\\s\]+(\\S+)\[\\t\\s\]*(PI|PO|IO|I|O)?.*?$');
const func_name_regex = new RegExp('^\[\\t\\s\]*(>|<)\[\\t\\s\]*(.*)$');

const grid = 2.54;
const font_size = 2;
const pin_length = 5.08;
const num_part_length = grid_aligm(font_size*4)
const pin_types ={"PO": "power_out", "PI":"power_in", "IO": "bidirectional", "I": "input", "O": "output"};

/*!
 *  Calculate length of pins label 
 */
function pin_label_length(label) {
    const font_width = font_size + 0.5
    
    if(label.substring(0,2).toUpperCase() == "N_")
        return (label.length-2)*font_width;
    else if(label.substring(0,1) == "n")
        return (label.length-1)*font_width;
    else
        return (label.length)*font_width;
}


/*!
 *  Return Pin label with all need parsing
 */
function parse_pin_label(label) {
    if(label.substring(0,2).toUpperCase() == "N_")
        return "~{" + label.substring(2) + "}";
    else if(label.substring(0,1) == "n")
        return "~{" + label.substring(1) + "}";
    else
        return label;
}


/*!
 *  Aligment size to grid
 */
function grid_aligm(val) {
    return Math.round(val/grid)*grid
}


/*!
 *  Call when page is load, can be use to generate description, additional init and etc.
 */
function onload_handler() {
	out_text = "empty - passive<br>"
	for (var key in pin_types) {
		if (pin_types.hasOwnProperty(key)) {           
			out_text += `"${key}" - ${pin_types[key]}<br>`;
		}
	}
		
	document.getElementById("pin_types_info").innerHTML = out_text
	
	document.getElementById("page_header").innerHTML = "<h3>Module generation</h3>"
		
	document.getElementById("description").innerHTML = `Place in textarea list of pin in format: "pin_number pin_name [pin_type] [additional info]".<br> 
                                To add invert symbol, type nPinName or N_PinName <br>
								To delimeter pins by group as separate unit subsymbol use format: "&lt;|&gt;Functional name" in pin list (&lt; - left side placment, &gt; - right side placment) .<br>
								After generation take text from popup and past it into necesary *.kicad_sym file, or use Save file button to save symbol in separate *.kicad_sym file.<br>`									
} 


/*!
 *  Update file name showen in popup window
 */
function  upd_poup_header() {
	mod_name = document.getElementById("symbol_name").value;
	mod_name = mod_name.replace(/\s/g, "_");
	document.getElementById("file_name").innerHTML = `${mod_name}.kicad_sym`;
};


/*! 
 * Parse text to pin list
 */
function get_parsed_pins(raw_list) {		
	sort_list = { "": { lside_pins: [], rside_pins: [] } }
	sub_list = []
	func_name = ">"; // By default add pins at right side
    
	lines = raw_list.split("\n")
	
	lines.forEach(function (item, index) {        
		if(item.match(func_name_regex) != null) {
			if(sub_list.length != 0) { 
                if(func_name.substring(0,1) == "<")
                    sort_list[func_name.substring(1)]["lside_pins"] = sub_list;
                else if(func_name.substring(0,1) == ">")
                    sort_list[func_name.substring(1)]["rside_pins"] = sub_list;
				sub_list = []
			}
		
			if(item.match(func_name_regex) != null) { 
				func_name = func_name_regex.exec(item)[1] + func_name_regex.exec(item)[2];
			} else {
				func_name = ">";
			}
			
			if( !(func_name.substring(1) in sort_list) ) {
                sort_list[func_name.substring(1)] = {};
                sort_list[func_name.substring(1)]["lside_pins"] = new Array();
                sort_list[func_name.substring(1)]["rside_pins"] = new Array();            
            };
            
		} else {
			if (item.match(pin_regex) != null) {
				pin_type = "passive"
				temp = pin_regex.exec(item)
				if(temp[3] !== undefined) pin_type = pin_types[temp[3]]
				sub_list.push({"index":temp[1], "label":temp[2], "type":pin_type})
			} 
		}
	});
	
	if(sub_list.length != 0) {
        if(func_name.substring(0,1) == "<")
                    sort_list[func_name.substring(1)]["lside_pins"] = sub_list;
                else if(func_name.substring(0,1) == ">")
                    sort_list[func_name.substring(1)]["rside_pins"] = sub_list;
    }
	
	return sort_list;
};


/*!
 *	Check pin to duplicate
 */
function is_id_duplicate(pins_list) {
	result = "";
	id_dict = {};
    for (const [key, value] of Object.entries(pins_groups)) {
        pins_groups[key]["rside_pins"].forEach(function(item) {
 			if(id_dict[item["index"]] === undefined) id_dict[item["index"]]= "1";
 			else result = item["index"];
 		});
        pins_groups[key]["lside_pins"].forEach(function(item) {
 			if(id_dict[item["index"]] === undefined) id_dict[item["index"]]= "1";
 			else result = item["index"];
 		});
    }

	return result;
}


/*!
*  Generate symbol property
*/
function symbol_property_gen() {
    symbl_name = document.getElementById("symbol_name").value
    
	sym_prop = [{prop: "Reference", value: "A", pos_x: -5.08, pos_y: 7.62, font: 2},
	{prop: "Value", value: symbl_name, pos_x: symbl_name.length, pos_y: 7.62, font: 2},
	{prop: "Footprint", value: "", pos_x: 20.32, pos_y: 7.62, font: 2},
	{prop: "Datasheet", value: document.getElementById("symbol_ds").value, pos_x: -2.54, pos_y: 21.59, font: 1.27},
	{prop: "ki_locked", value: "", pos_x: 0, pos_y: 0, font: 1.27},
	{prop: "ki_keywords", value: "", pos_x: 0, pos_y: 0, font: 1.27},
	{prop: "ki_description", value: document.getElementById("symbol_desc").value, pos_x: 0, pos_y: 0, font: 1.27},]
	
	return_text = "";
	sym_prop.forEach(function (item, index) {
		return_text += `(property "${item["prop"]}" "${item["value"]}" (id ${index}) `;
		return_text += `(at ${item["pos_x"]} ${item["pos_y"]} 0) `;
		return_text += `(effects (font (size ${item["font"]} ${item["font"]}))))\r\n`
	});
	
	return return_text;
}


/*!
 * Based on pins list, calc size of body, placment for vertical lines, and etc.
 */
function calc_body_size(pins_lists) {
    ret_dic = {"body_length": 0, "left_width": 0, "right_width": 0};
    min_width = grid_aligm(font_size * 10)
    
    // Right side pins
    body_length = 0;
    pins_lists["rside_pins"].forEach(function(item) {
        if(pin_label_length(item["label"]) > ret_dic["right_width"]) ret_dic["right_width"] = grid_aligm(pin_label_length(item["label"]));
        body_length += grid_aligm(font_size)*2.0;
    });
    if((ret_dic["right_width"] != 0) && (ret_dic["right_width"] < min_width))
        ret_dic["right_width"] = min_width
        
    ret_dic["body_length"] = body_length;
    
    // Left side pins
    body_length = 0;
    pins_lists["lside_pins"].forEach(function(item) {
        if(pin_label_length(item["label"]) > ret_dic["left_width"]) ret_dic["left_width"] = grid_aligm(pin_label_length(item["label"]));
        body_length += grid_aligm(font_size)*2.0; 
    });
    if((ret_dic["left_width"] != 0) && (ret_dic["left_width"] < min_width))
        ret_dic["left_width"] = min_width
    
    if(body_length > ret_dic["body_length"])
        ret_dic["body_length"] = body_length;
        
    return ret_dic;
};


/*!
 * Generate text description for body (text and lines)
 */
function generate_body(fname, body_size) {
    text = "";
    rec_start = 0
    rec_end = 0
    y_body_top = grid_aligm(font_size*2.0)
    
    if((body_size["left_width"] != 0) && (body_size["right_width"] != 0)) {
        text += `(text "Цепь" (at -${body_size["left_width"]/2.0} ${y_body_top/2.0} 0)(effects (font (size ${font_size} ${font_size}))))\r\n`
        text += `(text "Цепь" (at ${body_size["right_width"]/2.0} ${y_body_top/2.0} 0)(effects (font (size ${font_size} ${font_size}))))\r\n`
        
        rec_start = -(body_size["left_width"] + num_part_length)
        rec_end = body_size["right_width"]  + num_part_length
        text += `(polyline (pts (xy -${body_size["left_width"]} ${y_body_top}) (xy -${body_size["left_width"]} -${body_size["body_length"]})) (stroke (width 0) (type default) (color 0 0 0 0)) (fill (type none)))\r\n`;
        text += `(polyline (pts (xy ${body_size["right_width"]} ${y_body_top}) (xy ${body_size["right_width"]} -${body_size["body_length"]})) (stroke (width 0) (type default) (color 0 0 0 0)) (fill (type none)))\r\n`;
    
    } else {
        if(body_size["left_width"] != 0) {
            text += `(text "Цепь" (at ${body_size["left_width"]/2.0} ${y_body_top/2.0} 0)(effects (font (size ${font_size} ${font_size}))))\r\n`
            rec_start = -num_part_length
            rec_end = body_size["left_width"]
        } else {
            text += `(text "Цепь" (at -${body_size["right_width"]/2.0} ${y_body_top/2.0} 0)(effects (font (size ${font_size} ${font_size}))))\r\n`
            rec_start = -body_size["right_width"]
            rec_end = num_part_length
        }
    }
    text += `(polyline (pts (xy 0 ${y_body_top}) (xy 0 -${body_size["body_length"]})) (stroke (width 0) (type default) (color 0 0 0 0)) (fill (type none)))\r\n`;

    text += `(rectangle (start ${rec_start} ${y_body_top}) (end ${rec_end} -${body_size["body_length"]}) (stroke (width 0) (type default) (color 0 0 0 0)) (fill (type none)))\r\n`;
    
    for(i=0; i<body_size["body_length"]; i+= grid_aligm(font_size*2)) {
        text += `(polyline (pts (xy ${rec_start} -${i}) (xy ${rec_end} -${i})) (stroke (width 0) (type default) (color 0 0 0 0)) (fill (type none)))\r\n`;
    }
    text += `(text "${fname}" (at 0 -${body_size["body_length"]+font_size} 0)(effects (font (size ${font_size} ${font_size}))))\r\n`
    
    return text;
};


/*!
 * Generate text description for pins
 */
function pins_placer(pins_lists, body_size) {
    text = ""
    
    // Right side pins
    y_pos = 0;
    x_pos = body_size["right_width"] + num_part_length + pin_length;
    if(body_size["left_width"] == 0)
        x_pos = num_part_length + pin_length        
    pins_lists["rside_pins"].forEach(function(item) {
        y_pos += grid_aligm(font_size);
        text += `(pin ${item["type"]} line (at ${x_pos} -${y_pos} 180) (length ${pin_length}) 
                (name "${parse_pin_label(item["label"])}" (effects (font (size ${font_size} ${font_size})))) 
                (number "${item["index"]}" (effects (font (size ${font_size} ${font_size})))))\r\n`
        text += `(text "${item["index"]}" (at ${x_pos-pin_length-num_part_length/2.0} -${y_pos} 0)(effects (font (size ${font_size} ${font_size}))))\r\n`
        text += `(text "${parse_pin_label(item["label"])}" (at ${x_pos-pin_length-num_part_length - body_size["right_width"]/2.0} -${y_pos} 0)(effects (font (size ${font_size} ${font_size}))))\r\n`
        y_pos += grid_aligm(font_size);        
    });
    
    // Left side pins
    y_pos = 0;
    x_pos = (body_size["left_width"] + num_part_length + pin_length);
    if(body_size["right_width"] == 0)
        x_pos = (num_part_length + pin_length); 
    pins_lists["lside_pins"].forEach(function(item) {
        y_pos += grid_aligm(font_size);
        text += `(pin ${item["type"]} line (at -${x_pos} -${y_pos} 0) (length ${pin_length}) 
                (name "${parse_pin_label(item["label"])}" (effects (font (size ${font_size} ${font_size})))) 
                (number "${item["index"]}" (effects (font (size ${font_size} ${font_size})))))\r\n`
        text += `(text "${item["index"]}" (at -${x_pos-pin_length-num_part_length/2.0} -${y_pos} 0)(effects (font (size ${font_size} ${font_size}))))\r\n`
        text += `(text "${parse_pin_label(item["label"])}" (at -${x_pos-pin_length-num_part_length - body_size["left_width"]/2.0} -${y_pos} 0)(effects (font (size ${font_size} ${font_size}))))\r\n`
        y_pos += grid_aligm(font_size);        
    });
    
    return text; 
};


/*!
 *  Main process for build kicad symbol structure
 */
function process(){
	sub_index = 1;
    upd_poup_header();

	pins_groups = get_parsed_pins(document.getElementById("pin_list").value);
	symbl_name = document.getElementById("symbol_name").value.replace(/\s/g, "_");
    //is_gnd_concate = document.getElementById("is_gnd_concate").checked;
	
	if((dupl_id = is_id_duplicate(pins_groups)) != "") {
		document.getElementById("output").value = "";
		alert("Found duplicated pins id: " + dupl_id);
		return;
	}
	// Symbol header
	symbol_text	= `(symbol "${symbl_name}" (pin_numbers hide) (pin_names hide) (in_bom yes) (on_board yes)\r\n`
	
	symbol_text	+= symbol_property_gen();
	
	// Unit generation
 	for (const [key, value] of Object.entries(pins_groups)) {
        
        // Skip if both pins list is empty
        if( (pins_groups[key]["rside_pins"].length == 0) && (pins_groups[key]["lside_pins"].length == 0))
            continue;
                
        // Calculate size of rectangel
        body_sizes = calc_body_size(pins_groups[key]);
        
        // Plot rectangle with texts
        symbol_text += `(symbol "${symbl_name}_${sub_index}_0"\r\n`
        symbol_text += generate_body(key, body_sizes);
        symbol_text += `)\r\n`
        
        // Place pins
        symbol_text += `(symbol "${symbl_name}_${sub_index}_1"\r\n`
        symbol_text += pins_placer(pins_groups[key], body_sizes);
        symbol_text += `)\r\n`
        
        sub_index += 1;
        
    }
	document.getElementById("output").value = symbol_text + ")";
};


/*!
 *  Save .kicad_sim file
 */
function save_file() {
	if(document.getElementById("output").value == "") {
		alert("Output is empty")
	} else {
		var a = document.createElement("a");
		a.href = window.URL.createObjectURL(new Blob(["(kicad_symbol_lib (version 20211014) (generator kicad_symbol_editor)" + document.getElementById("output").value + ")"], {type: "text/plain"}));
		a.download = `${document.getElementById("file_name").innerHTML}`;
		a.click();
		alert("File is saved as ".concat(a.download))
	}
};
