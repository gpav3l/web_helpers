const module_name_regex = /\s*module\s+(\w+)(\(|#|\s)/gm;
const param_regex = /parameter\s+(\w+\s+)?(\w+)\s*=\s*(\W?\w+\W?)(\s*,|\s*\)|\s*$)/gm;
const pin_regex = /\s*(input|output)\s+(\[.*\])?\s*(.*),$/gm;

/*!
 *  Call when page is load, can be use to generate description, additional init and etc.
 */
function onload_handler() {

    document.getElementById("page_header").innerHTML = "<h3>Generator of verilog test bench</h3>"
		
	document.getElementById("description").innerHTML = `Place moule description into text input.`
} 


/*!
 * Parse input text
 */
function parsed_input(raw_list) {
	module_name = "";
	params = [];
	pins = [];

	lines = raw_list.split("\n")

	lines.forEach(function (item, index) {
		// Try found module name
		if(item.match(module_name_regex) != null) {
			module_name = module_name_regex.exec(item)[1]
		}

		// Try found parameter
		if(item.match(param_regex) != null) {
			m = param_regex.exec(item)
			params.push({"name":m[2], "def_val":m[3]})
		}

		// Try found pin description
		if(item.match(pin_regex) != null) {
			m = pin_regex.exec(item)
			pins.push({"dir":m[1], "name":m[3], "bus":m[2]})
		}
	});

	return {module_name, params, pins};
};


/*!
 *  Main process for build kicad symbol structure
 */
function process(){

	module_info = parsed_input(document.getElementById("pin_list").value);

	document.getElementById("file_name").innerHTML = `tb_${module_info.module_name}.v`;

	out_text="`timescale 1ns / 1ps\n\n";

	out_text += `module tb_${module_info.module_name}();\n\n`;

	// Gen list of internal signals
	module_info.pins.forEach(function (item) {
		if(item["dir"] == "input") out_text += "reg ";
		else if (item["dir"] == "output") out_text += "wire ";
		if(item["bus"] != undefined) out_text += `${item["bus"]} `;
		out_text += `${item["name"]}`
		if(item["dir"] == "input") out_text += " = 0;\n";
		else out_text += `;\n`;
	});
	out_text += '\n';

	// Generate tested module connections
	out_text += `${module_info.module_name} `;
	if(module_info.params.length != 0) {
		out_text += ` #(\n`;
		for(i =0; i<module_info.params.length; i++) {
			out_text += `  .${module_info.params[i]["name"]} ( ${module_info.params[i]["def_val"]} )`;
			if(i != module_info.params.length-1) out_text += ",\n"
			else out_text += "\n)"
		}
	}

	out_text += ` DUT (\n`

	for(i =0; i<module_info.pins.length; i++) {
		out_text += `  .${module_info.pins[i]["name"]} ( ${module_info.pins[i]["name"]} )`;
		if(i != module_info.pins.length-1) out_text += ",\n"
		else out_text += "\n);"
	}

	// Generate initial list
	out_text += "\n\ninitial begin\n\nend\n\n"

	out_text += "endmodule\n"
	document.getElementById("output").value = out_text;
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
