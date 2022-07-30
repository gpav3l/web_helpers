function gen_page_content() {
	// Gen list of item in sidebar with set active for current page
	gen_page_list();
	
};


function gen_page_list() {
	var arr = new Array();
	arr.push({name: "Pin sorter", address: "index.html"})
	arr.push({name: "Connector", address: "pages/connector_gen.html"});
	arr.push({name: "Module", address: "pages/module_gen.html"});
	arr.push({name: "IC", address: "pages/ic_gen.html"});
	
	var href_parts = window.location.href.split("/")
	href_parts.pop() // Remove .html
	
	// If in pages folder, remove it also
	if(href_parts[href_parts.length-1] == "pages")
		href_parts.pop()

	var new_href=href_parts.join("/")
					
	ul_content = ""
	for(i=0; i<arr.length; i++) {
		ul_content += `<li class="nav-item"><a href="${new_href}/${arr[i].address}" class="nav-link link-dark`;
		if(window.location.href.includes(arr[i].address))
			ul_content += ` active`
		ul_content += `">${arr[i].name}</a></li>`
	}
	document.getElementById("page_list").innerHTML = ul_content;
};
