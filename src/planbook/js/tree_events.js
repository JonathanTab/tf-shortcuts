function treeEvents() {
	$('#tree_view')
	.on("ready.jstree", function (e, data) {
		// sketchup.tree_view_ready()
	})
	
	// refresh
	.on('refresh.jstree', function (e, data) {
		setIcons()
	})

	// load_node
	.on('load_node.jstree', function (e, data) {
		setIcons()
		sketchup.tree_view_ready()
	})

	// Selection
	.on("changed.jstree", function (e, data) {
		// console.log("changed")
		var checkbox = $('.jstree-checkbox').is(":visible")
		if (!checkbox){ 
			var inst = 	$('#tree_view').jstree(true);
			selected = inst.get_selected(true);
			setStatusbar(selected)
			sketchup.selection_changed(getAllSketchupItemSelected(selected, false))
		}
	})
	// checkbox
	.on('check_node.jstree', function (e, data) {
		// setStatusbar(data.selected)
		selected = $('#tree_view').jstree(true).get_checked(true);
		setStatusbar(selected)
		sketchup.selection_changed(getAllSketchupItemSelected(selected, false))
	})
	.on('uncheck_node.jstree', function (e, data) {
		selected = $('#tree_view').jstree(true).get_checked(true);
		setStatusbar(selected)
		sketchup.selection_changed(getAllSketchupItemSelected(selected, false))
	})
	.on('check_all.jstree', function (e, data) {
		selected = $('#tree_view').jstree(true).get_checked(true);
		setStatusbar(selected)
		sketchup.selection_changed(getAllSketchupItemSelected(selected, false))
	})
	.on('uncheck_all.jstree', function (e, data) {
		selected = $('#tree_view').jstree(true).get_checked(true);
		setStatusbar(selected)
		sketchup.selection_changed(getAllSketchupItemSelected(selected, false))
	})

	// node
	// rename
  .on('create_node.jstree', function (e, data) {
		// sketchup.create_node(data.node, data.parent, data.position);
	})

	// rename
  .on('rename_node.jstree', function (e, data) {
		var inst = $('#tree_view').jstree(true)
		obj = data.node
		if (DEFAULT_GROUPS.includes(data.old)){
			inst.set_text(obj, data.old)
			return
		}

		sketchup.rename_node(data.node, data.text, data.old, {
			onCompleted: function () {
				inst.deselect_all()
				inst.select_node(obj)
				if (obj.text === data.text){
					// rename thanh cong
					parent = obj.parent
					if (parent != "#"){
						node = inst.get_node(parent)
						if (node && node.data && node.data.prefix){
							sortByPrefix(node)
						}
					}
				}
			}
		});
		storeTreeView("rename")
	})

	// remove
	.on('delete_node.jstree', function (e, data) {
		// sketchup.delete_node(data.node, data.parent);
		// storeTreeView()
	})

	// copy node
	.on('copy_node.jstree', function (e, data) {
		// set attributes
		id = data.node["id"]
		original_id = data.original["id"]

		data_node = data.node.data
		if (data_node==null){data_node = {}}
		data_node.original_id = original_id

		data.node.data = data_node

		sketchup.copy_node(data.node, data.original);
		storeTreeView("copy node")
	})
	// paste
	.on('paste.jstree', function (e, data) {
		sketchup.paste(data.parent, data.node, data.mode);
		storeTreeView("paste")
	})

	// move_node
	.on('move_node.jstree', function (e, data) {
		var inst = $('#tree_view').jstree(true)
		var node  = data.node
		var default_length = DEFAULT_GROUPS_IDS.length
		if (node.parent === "#" && !DEFAULT_GROUPS_IDS.includes(node.id) && data.position < default_length){
			// tra ve old_position
			inst.move_node(node, data.old_parent, data.old_position+1)
			storeTreeView("move_node");
			return;
		}

		setIcon(data.node, inst)
	})

	// open node
	.on('after_open.jstree', function (e, data) {
		console.log("after_open", $("#search").val())
		storeTreeView("open_node")
	})
	// close node
	.on('after_close.jstree', function (e, data) {
		console.log("after_close", $("#search").val())
		storeTreeView("close_node")
	})

	.on('search.jstree', function (e, data) {
		console.log("search.jstree", $("#search").val())
	})

	// contextmenu
	.on('show_contextmenu.jstree', function (e, data) {
		if (custom_menu == true && custom_menu_has_node == false && data.node["id"] == DEFAULT_GROUPS_IDS[0]){
			$('#tree_view').jstree(true).deselect_node(data.node)
		}
	})

	// dnd
	$(document).on("dnd_stop.vakata", function () {
		storeTreeView("dnd_stop");
	});
	$('#tree_view').on("dblclick.jstree", ".jstree-anchor", $.proxy(function (e) {
		if(e.target.tagName && e.target.tagName.toLowerCase() === "input") { return true; }

		node = $('#tree_view').jstree(true).get_node(e.target);
		if (node.type == "sketchup_item"){ sketchup.set_selected(node); }
	}))
}