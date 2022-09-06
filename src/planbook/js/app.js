const MAC = navigator.platform.toUpperCase().indexOf('MAC')>=0;

const DEFAULT_GROUPS = [
													"Plans",
													"Sections",
													"Elevations",
													"Interior Elevations",
													"3D Views",
													"Detail Views",
													"Modeling",
												]
const DEFAULT_GROUPS_IDS = [
													"plan",
													"section",
													"elevation",
													"ie",
													"detail",
													"view3d",
													"modeling"
												]
const SKETCHUP_ITEM = "Scene"
const ICONS = {
	"default" : "../css/img/icon_group.png",
	"sketchup_item" : "../css/img/icon_scene.png",
	"plan" : "../css/img/icon_plan.png",
	"section" : "../css/img/icon_section.png",
	"elevation" : "../css/img/icon_elevation.png",
	"ie" : "../css/img/icon_ie.png",
	"detail" : "../css/img/icon_detail.png",
	"view3d" : "../css/img/icon_view3d.png",
	"modeling" : "../css/img/icon_modeling.png",
}

$(document).ready(function() {
	$('#tree_view').jstree({
		'core' : {
			"animation" : 0,
			"check_callback" : true,
			"themes" : { "stripes" : true },
			"multiple" : true
		},
		"types" : {
			"#" : {
				"max_children" : 1,
				"max_depth" : 4,
				"valid_children" : [
					"plan",
					"section",
					"elevation",
					"ie",
					"detail",
					"view3d",
					"modeling",
					"default",
					"sketchup_item",
				]
			},
			"default" : {
				"icon" : ICONS["default"],
				"valid_children" : ["default", "sketchup_item"]
			},
			"sketchup_item" : {
				"icon" : ICONS["sketchup_item"],
				"valid_children" : []
			},
			"plan" : {
				"icon" : ICONS["plan"],
				"valid_children" : ["default", "plan_view", "sketchup_item"]
			},
			"section" : {
				"icon" : ICONS["section"],
				"valid_children" : ["default", "section_view", "sketchup_item"]
			},
			"elevation" : {
				"icon" : ICONS["elevation"],
				"valid_children" : ["default", "elevation_view", "sketchup_item"]
			},
			"ie" : {
				"icon" : ICONS["ie"],
				"valid_children" : ["default", "ie_view", "sketchup_item"]
			},
			"detail" : {
				"icon" : ICONS["detail"],
				"valid_children" : ["default", "detail_view", "sketchup_item"]
			},
			"view3d" : {
				"icon" : ICONS["view3d"],
				"valid_children" : ["default", "view3d_view", "sketchup_item"]
			},
			"modeling" : {
				"icon" : ICONS["modeling"],
				"valid_children" : ["default", "modeling_view", "sketchup_item"]
			},
    },
		"plugins" : [
			"contextmenu", "dnd", "search",
			"state", "types", "wholerow",
			"checkbox"
		],
		"contextmenu": {
			"items": function () {
				if (custom_menu==true){
					return itemsCustomMenu()
				}else{
					return itemsContextMenu()
				}
			},
			"show_at_node": false
		},
		"dnd":{
			is_draggable :  function (node) {
				var inst = $('#tree_view').jstree(true);
				ids = inst.get_top_selected();
				var chk = ids.some(function (id) {
					return DEFAULT_GROUPS_IDS.includes(id)
				})
				return !chk
			},
			"copy" : false
		},
		"checkbox": {
			"visible": false,
      // "three_state" : false,
      "whole_node" : false,//Used to check/uncheck node only if clicked on checkbox icon, and not on the whole node including label
      "tie_selection" : false
    },
		"search": {
			"show_only_matches": true,
    },
	});

	// menu
	// update
	$("#updateItem").click(function () {
		sketchup.update_current_item()
	})

	// add
	$("#addItem").click(function () {
		var inst = $('#tree_view').jstree(true);

		// get parent
		selected = inst.get_selected(true)
		if (selected.length > 0){
			parent = selected[0]
			type = inst.get_type(parent)
			if (type=="sketchup_item"){
				parent = inst.get_parent(parent);
			}
		}else{
			parent = "#"
		}

		inst.create_node(parent, {text:"New " + SKETCHUP_ITEM, type:"sketchup_item"}, "last", function (new_node) {
			prev = inst.get_node(inst.get_prev_dom(new_node))
			path = inst.get_path(new_node, null, true)
			setIcon(new_node, inst)

			// add page in sketchup
			sketchup.create_node(new_node, path, prev);

			// edit name
			try {
				inst.edit(new_node);
			} catch (ex) {
				setTimeout(function () { inst.edit(new_node); },0);
			}
		});
	})

	// delete
	$("#deleteItem").click(function () {
		var inst = inst = $('#tree_view').jstree(true);
		var result = getAllSketchupItemSelected(undefined, true);

		// remove defaults
		var remove = []
		for (let i = 0; i < result.length; i++) {
			const node = result[i];
			if(!DEFAULT_GROUPS_IDS.includes(node["id"])){ remove.push(node) }
		}

		sketchup_items = []
		remove.map(function(item){
			sketchup_items.push(item["text"])
		})

		if (remove.length == 0){ alert("No selected!"); return;};

		if(confirm("Are you sure you want to delete "+SKETCHUP_ITEM+"(s)?\n"+sketchup_items)){
			inst.delete_node(remove);
			sketchup.delete_node(remove);
			storeTreeView("delete_node")
		}
	})

	// right_top_menu
	$("#right_top_menu").click(function () {
		toggleMenu();
	})

	// search
	var to = false;
  $('#search').keyup(function () {
    if(to) { clearTimeout(to); }
    to = setTimeout(function () {
      var v = $('#search').val();
      $('#tree_view').jstree(true).search(v);
    }, 250);
	});

	// layer state
	$("#layerVisibleSelected").change(function () {
		check = $(this).prop("checked")
		if (check){
			$("#layerHiddenSelected").prop("checked", false)
		}
	});

	$("#layerHiddenSelected").change(function () {
		check = $(this).prop("checked")
		if (check){
			$("#layerVisibleSelected").prop("checked", false)
		}
	});

	$("#getLayer").click(function () {
		sketchup.get_layer()
	});

	$("#okLayer").click(function () {
		// get selected
		var selected = getAllSketchupItemSelected(undefined, true)

		// get settings
		var settings = {}
		settings.hidden_selected = $('#layerHiddenSelected').prop("checked");
		settings.only_visible_selected = $('#layerVisibleSelected').prop("checked");
		settings.use_behavior = $('#layer_use_behavior').prop("checked");

		settings.layerExisting = $('input[name="layerExisting"]:checked').val()
		settings.layerNew = $('input[name="layerNew"]:checked').val()

		// sent to sketchup
		sketchup.set_layers_state(selected, settings, {
			onCompleted: function() {
				$("#menu_layer_state").hide();
			}
		})
	});

	$("#cancelLayer").click(function () {
		$("#menu_layer_state").hide();
	});

	$("#layer_use_behavior").change(function(){
		use = $(this).prop("checked")
		if (use){
			$("#layer_behavior").children('.settings').children("input").prop('disabled', false)
		}else{
			$("#layer_behavior").children('.settings').children("input").prop('disabled', true)
		}
	})

	// entities_state
	$("#okEntity").click(function () {
		// get selected
		var selected = getAllSketchupItemSelected(undefined, true)

		// get settings
		setting = $('input[name="entityState"]:checked').val()

		// sent to sketchup
		sketchup.set_entities_state(selected, setting, {
			onCompleted: function() {
				$("#menu_entities_state").hide();
			}
		})
	});

	$("#cancelEntity").click(function () {
		$("#menu_entities_state").hide();
	});

	$( window ).resize(function() {
		layoutDialog();
	});

	$( "#resizable" ).resizable({
		handles : {
			'n': '.ui-resizable-n'
		}
	});

	$('.accordion').click(function () {
		var  $container = $(this).parent()
		var control = $(this).children('button')
		var content = $container.children('.content')

		$(control).toggleClass('active');
		visible = $(control).hasClass('active')

		setAccordionState($container.attr("id"), visible)
	});

	setAccordionState("properties", false);

	layoutDialog();

	treeEvents()

	sketchup.ready()
})

// control visible properties
function setAccordionState(id, visible) {
	var  $container = $('#'+id)
	var control = $container.children('.accordion').children('button')
	var content = $container.children('.content')
	if (visible==true){
		$(control).addClass('active')
	}else{
		$(control).removeClass('active')
	}

	if ($(control).hasClass('active')){
		$(content).show()
	}else{
		$(content).hide()
	}

	layoutDialog();

	if (visible == false && prop.onEditDescription ){
		prop.cancelDescription();
	}
}

function layoutDialog() {
	var height = $( document ).height()

	$("#properties").css("max-height", screen.height/2)
	$("#properties_table").css("max-height", screen.height/2 - 30)

	content_height = height - 60;
	if ($("#resizable").outerHeight() > height-110){
		$("#resizable").outerHeight(content_height-50);
	}

	var header_height = $( "#header" ).height()
	var footer_height = $( "#footer" ).height()

	tree_height = height-(header_height + footer_height)
	$('#tree_view').height(tree_height)
}

function getIcon(type) {
	console.log(type)
}

function itemsContextMenu(node) {
	console.log("set itemsContextMenu");

	var items = {
		"make_group" : {
			"separator_before"	: false,
			"separator_after"	: false,
			"_disabled"			: function (data) {
				var inst = $.jstree.reference(data.reference),
				ids = inst.get_top_selected();
				var chk = ids.some(function (id) {
					return DEFAULT_GROUPS_IDS.includes(id)
				})
				return chk
			},
			"label"				: "Make Group",
			"action"			: function (data) {
				var inst = $.jstree.reference(data.reference),
				selected = inst.get_selected(data.reference);
				top_selected = inst.get_bottom_selected();

				if (selected.length == 1){
					current = selected[0]
				}else{
					// tìm node có path ngắn nhất để xác định vị trí create_node
					paths = []
					selected.forEach(function(node) {
						paths.push(inst.get_path(node, null, true))
					})

					path = paths[0]
					length = path.length
					paths.forEach(function(p) {
						if (p.length < length){
							length = p.length;
							path = p
						}
					})

					current = path[path.length - 1];
				}

				if ( DEFAULT_GROUPS.includes( inst.get_text(current) ) ){
					return
				}

				// create new group
				var default_name = "New Group"
				inst.create_node(current, {text: default_name}, "before", function (new_node) {
					inst.move_node(selected, new_node);
					inst.open_node(new_node);
					setIcon(new_node, inst)
					try {
						inst.edit(new_node);
					} catch (ex) {
						setTimeout(function () { inst.edit(new_node); },0);
					}
				});

				// move selected to new group
			}
		},

		"explode" : {
			"separator_before"	: false,
			"separator_after"	: true,
			"_disabled"			: function (data) {
				var inst = $.jstree.reference(data.reference),
				selected = inst.get_selected(data.reference);
				return !(selected.length == 1 && inst.get_type(selected[0]) == "default")
			},
			"label"				: "Explode",
			"action"			: function (data) {
				var inst = $.jstree.reference(data.reference),
				obj = inst.get_node(data.reference);

				var children = obj.children
				while(children.length !== 0) {
					inst.move_node(children, obj, "before");
					children = obj.children
				}

				inst.delete_node(obj);
				storeTreeView("explode")
			}
		},
		// "create" : {
		// 	"separator_before"	: false,
		// 	"separator_after"	: true,
		// 	"_disabled"			: false, //(this.check("create_node", data.reference, {}, "last")),
		// 	"label"				: "Add " + SKETCHUP_ITEM,
		// 	"action"			: function (data) {
		// 		var inst = $.jstree.reference(data.reference),
		// 			obj = inst.get_node(data.reference);
		// 			type = inst.get_type(obj)
		// 			if (type=="sketchup_item"){
		// 				obj = inst.get_parent(obj);
		// 			}

		// 		inst.create_node(obj, {text:"New " + SKETCHUP_ITEM, type:"sketchup_item"}, "last", function (new_node) {
		// 			prev = inst.get_node(inst.get_prev_dom(new_node))
		// 			path = inst.get_path(new_node, null, true)
		// 			setIcon(new_node, inst)
		// 			sketchup.create_node(new_node, path, prev);
		// 			try {
		// 				inst.edit(new_node);
		// 			} catch (ex) {
		// 				setTimeout(function () { inst.edit(new_node); },0);
		// 			}
		// 		});
		// 	}
		// },
		"rename" : {
			"_disabled"			: function (data) {
				var inst = $.jstree.reference(data.reference),
					obj = inst.get_node(data.reference);
					return isDefaultGroup(obj);
			},
			"label"				: "Rename",
			"shortcut"			: 113,
			"shortcut_label"	: 'F2',
			"action"			: function (data) {
				var inst = $.jstree.reference(data.reference),
					obj = inst.get_node(data.reference);
					if (isDefaultGroup(obj)){ return }
				inst.edit(obj);
			}
		},
		// "remove" : {
		// 	"_disabled"			: function (data) {
		// 		selected = getSelected()
		// 		return (selected.length == 1 && DEFAULT_GROUPS_IDS.includes(selected[0]))
		// 	},
		// 	"label"				: "Delete",
		// 	"action"			: function (data) {
		// 		var inst = $.jstree.reference(data.reference);
		// 		var result = getAllSketchupItemSelected(undefined, true);

		// 		// remove defaults
		// 		var remove = []
		// 		for (let i = 0; i < result.length; i++) {
		// 			const node = result[i];
		// 			if(!DEFAULT_GROUPS_IDS.includes(node["id"])){ remove.push(node) }
		// 		}

		// 		if (remove.length == 0){ alert("No selected!"); return;};

		// 		sketchup_items = []
		// 		remove.map(function(item){
		// 			sketchup_items.push(item["text"])
		// 		})

		// 		if(confirm("Are you sure you want to delete "+SKETCHUP_ITEM+"(s)?\n"+sketchup_items)){
		// 			inst.delete_node(remove);
		// 			sketchup.delete_node(remove);
		// 			storeTreeView()
		// 		}
		// 	}
		// },
		"ccp" : {
			"separator_after"	: true,
			"label"				: "Edit",
			"action"			: false,
			"submenu" : {
				"cut" : {
					"_disabled"			: function (data) {
						var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
							return isDefaultGroup(obj);
					},
					"label"				: "Cut",
					"action"			: function (data) {
						var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
						if(inst.is_selected(obj)) {
							inst.cut(inst.get_top_selected());
						}
						else {
							inst.cut(obj);
						}
					}
				},
				// "copy" : {
				// 	"label"				: "Copy",
				// 	"action"			: function (data) {
				// 		var inst = $.jstree.reference(data.reference),
				// 			obj = inst.get_node(data.reference);
				// 		if(inst.is_selected(obj)) {
				// 			inst.copy(inst.get_top_selected());
				// 		}
				// 		else {
				// 			inst.copy(obj);
				// 		}
				// 	}
				// },
				"paste" : {
					"_disabled" : function (data) {
						var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
						return !(inst.can_paste() && obj.type != "sketchup_item")
					},
					"separator_after"	: false,
					"label"				: "Paste",
					"action"			: function (data) {
						var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
						inst.paste(obj);
					}
				}
			}
		},
		"copy_properties" : {
			"_disabled" 	: function (data) {
				var inst = $.jstree.reference(data.reference),
					obj = inst.get_node(data.reference);
				return !(inst.get_selected().length==1 && obj.type == "sketchup_item")
			},
			"label"				: "Copy prop",
			"action"			: false,
			"submenu" : {
				"copy_axes" : { "label" : "Axes", "action" : function (data) { copyProp(data)} },
				"copy_camera" : { "label" : "Camera", "action" : function (data) { copyProp(data) } },
				"copy_entities" : { "label" : "Entities", "action" : function (data) { copyProp(data) } },
				"copy_layer" : { "label" : `${SKETCHUP_VERSION < 20 ? 'Layers' : 'Tags'}`, "action" : function (data) { copyProp(data) } },
				"copy_shadow" : { "label" : "Shadow", "action" : function (data) { copyProp(data) } },
				"copy_style" : { "label" : "Style", "action" : function (data) { copyProp(data) } },
				"copy_description" : { "label" : "Description", "action" : function (data) { copyProp(data) } },
			},

		},
		"paste_properties" : {
			"separator_after"	: true,
			"_disabled"			: function (data) {
				var inst = $.jstree.reference(data.reference)
				return (inst.get_selected().length==0)
			},
			"label"				: "Paste prop",
			"action"			: function (data) {
				var inst = $.jstree.reference(data.reference)
				obj = inst.get_node(data.reference);

				// if ( isDefaultGroup(obj) ){ return }

				var result = []

				if(inst.is_selected(obj)) {
					var selected = inst.get_selected()
					for (let index = 0; index < selected.length; index++) {
						const element = selected[index];
						getAllSketchupItem(inst, element, result)
					}
				}
				else {
					getAllSketchupItem(inst, obj, result)
				}

				// console.log(result);
				sketchup.paste_properties(result);
			}
		},
		"sort" : {
			"_disabled" 	: function (data) {
				var inst = $.jstree.reference(data.reference)
				return !(inst.get_selected(true).some(function (node) { return node.type != "sketchup_item" }))
			},
			"label"				: "Sort",
			"action"			: function (data) {
				var inst = $.jstree.reference(data.reference)
				var selected = inst.get_selected(true)
				for (let i = 0; i < selected.length; i++) {
					const node = selected[i];
					if (node.type != "sketchup_item"){ sortNode(node, false)}
				}
			}
		},
		"sort_by_prefix" : {
			"_disabled"			: function (data) {
				return !(inst.get_selected(true).some(function (node) { return node.type != "sketchup_item" }))
			},
			"separator_after"	: true,
			"label"				: "Sort by prefix",
			"action"			: function (data) {
				var inst = $.jstree.reference(data.reference)
				var selected = inst.get_selected(true)
				for (let i = 0; i < selected.length; i++) {
					const node = selected[i];
					if (node.type != "sketchup_item"){ sortByPrefix(node)}
				}
			}
		},
		"layer_state" : {
			"separator_before"	: true,
			"label"				: `${SKETCHUP_VERSION < 20 ? "Layers" : 'Tags'} States`,
			"action"			: function (data) {
				if ($("#menu_entities_state").is(":visible")){
					$("#menu_entities_state").hide()
				}
				if (!$("#menu_layer_state").is(":visible")){
					if (SKETCHUP_VERSION < 20) {

					} else {
						$("#getLayer").prop("value", "Get Tags");
					}

					$("#menu_layer_state").show()

					if ($("#layer_use_behavior").prop("checked")){
						$("#layer_behavior").children('.settings').children("input").prop('disabled', false)
					}else{
						$("#layer_behavior").children('.settings').children("input").prop('disabled', true)
					}
				}
			}
		},
		"entities_state" : {
			"label"				: "Entities States",
			"action"			: function (data) {
				if ($("#menu_layer_state").is(":visible")){
					$("#menu_layer_state").hide()
				}
				if (!$("#menu_entities_state").is(":visible")){
					$("#menu_entities_state").show()
				}
			}
		}
	};

	// Update for SketchUp 2020
	if (SKETCHUP_VERSION < 20) {
		copy_items = {
			"copy_camera" : { "label" : "Camera", "action" : function (data) { copyProp(data) } },
			"copy_entities" : { "label" : "Entities", "action" : function (data) { copyProp(data) } },
			"copy_layer" : { "label" : "Layers", "action" : function (data) { copyProp(data) } },
			"copy_shadow" : { "label" : "Shadow", "action" : function (data) { copyProp(data) } },
			"copy_axes" : { "label" : "Axes", "action" : function (data) { copyProp(data)} },
			"copy_style" : { "label" : "Style", "action" : function (data) { copyProp(data) } },
			"copy_description" : { "label" : "Description", "action" : function (data) { copyProp(data) } },
		}
	} else {
		copy_items =  {
			"copy_camera" : { "label" : "Camera", "action" : function (data) { copyProp(data) } },
			"copy_toplevel_geometry" : { "label" : "Top-Level Geometry", "cmd": "toplevel_geometry", "action" : function (data) { copyProp(data) } },
			"copy_object" : { "label" : "Hidden Objects", "cmd" : "hidden_objects", "action" : function (data) { copyProp(data) } },
			"copy_layer" : { "label" : "Tags", "action" : function (data) { copyProp(data) } },
			"copy_shadow" : { "label" : "Shadow", "action" : function (data) { copyProp(data) } },
			"copy_axes" : { "label" : "Axes", "action" : function (data) { copyProp(data)} },
			"copy_style" : { "label" : "Style", "action" : function (data) { copyProp(data) } },
			"copy_description" : { "label" : "Description", "action" : function (data) { copyProp(data) } },
		}
	}
	items.copy_properties.submenu = copy_items;

	// console.log(items);


	var inst = $('#tree_view').jstree(true);
	selected = inst.get_selected();
	if (!(selected.length == 1 && inst.get_type(selected[0]) != "sketchup_item")) {
		// Delete the "delete" menu item
		delete items.add_prefix;
	}
	if ((selected.length == 1 && inst.get_type(selected[0]) == "sketchup_item")) {
		// Delete the "delete" menu item
		delete items.create;
	}

	return items;
}

function itemsCustomMenu() {
	var items = {
		"expand_all" : {
			"separator_before"	: false,
			"separator_after"	: false,
			"_disabled"			: false,
			"label"				: "Expand All",
			"action"			: function (data) {
				var inst = $('#tree_view').jstree(true);
				inst.open_all();
				storeTreeView("expand_all")
			}
		},
		"collapse_all" : {
			"separator_before"	: false,
			"separator_after"	: true,
			"_disabled"			: false,
			"label"				: "Collapse All",
			"action"			: function (data) {
				var inst = $('#tree_view').jstree(true);
				inst.close_all();
				storeTreeView("collapse_all")
			}
		},
		"select_all" : {
			"separator_before"	: false,
			"separator_after"	: false,
			"_disabled"			: false,
			"label"				: function () {
				if ($('.jstree-checkbox').is(":visible")){
					return "Check All"
				}else{
					return "Select all"
				}
			},
			"action"			: function (data) {
				var inst = $('#tree_view').jstree(true);
				if ($('.jstree-checkbox').is(":visible")){
					inst.check_all();
				}else{
					inst.select_all();
				}
			}
		},
		"uncheck_all" : {
			"separator_before"	: false,
			"separator_after"	: true,
			"_disabled"			: false,
			"label"				: function () {
				if ($('.jstree-checkbox').is(":visible")){
					return "Uncheck All"
				}else{
					return "Deselect all"
				}
			},
			"action"			: function (data) {
				var inst = $('#tree_view').jstree(true);
				if ($('.jstree-checkbox').is(":visible")){
					inst.uncheck_all();
				}else{
					inst.deselect_all();
				}
			}
		},
		"export" : {
			"label"				: "2D Export",
			"action"			: function (data) {
				selected = getAllSketchupItemSelected(undefined, true)
				sketchup.export_2d("selected", selected);
			}
		},
		"to_dxf" : {
			"label"				: "Export to DXF",
			"action"			: function (data) {
				selected = getAllSketchupItemSelected(undefined, true)
				sketchup.export_dxf("selected", selected);
			}
		},
		"to_layout" : {
			"separator_after"	: true,
			"label"				: "Send to Layout",
			"action"			: function (data) {
				selected = getAllSketchupItemSelected(undefined, true)
				console.log(selected)
				sketchup.export_layout("selected", selected);
			}
		},
		"update_Section" : {
			"separator_after"	: true,
			"label"				: "Update Section",
			"action"			: function (data) {
				selected = getAllSketchupItemSelected(undefined, true)
				sketchup.update_section("selected", selected);
			}
		},
		"reorder_position" : {
			"separator_before"	: false,
			"separator_after"	: false,
			"_disabled"			: false,
			"label"				: "Reorder Position",
			"action"			: function (data) {
				var data = dataTreeView()
				sketchup.reorder_position(data);
			}
		},
		"purge_unused_group" : {
			"separator_before"	: false,
			"separator_after"	: false,
			"_disabled"			: false,
			"label"				: "Purge unused",
			"action"			: function (data) {
				var inst = $('#tree_view').jstree(true);
			}
		},
	};
	return items;
}

function toggleChecboxes() {
	$('#tree_view').jstree(true).toggle_checkboxes();
	setStatusbar()
	selected = getAllSketchupItemSelected(undefined, false)
	sketchup.selection_changed(selected)
}

var custom_menu = false
var custom_menu_has_node = false
function toggleMenu() {
	inst = $('#tree_view').jstree(true);
	selected = inst.get_selected()
	if (selected.length == 0){
		inst.select_node(DEFAULT_GROUPS_IDS[0])
		selected = inst.get_selected()
		custom_menu_has_node = false;
	}else{
		custom_menu_has_node = true;
	}

	custom_menu = true
	$('#tree_view').jstree(true).show_contextmenu(selected[0], 3000, 25);
	custom_menu = false
}

function isDefaultGroup(node) {
	inst = $('#tree_view').jstree(true);
	name = inst.get_text(node);
	return DEFAULT_GROUPS.includes(name)
}

function isInstance(node) {
	data_node = node.data
	return (data_node != null && data_node.original_id != undefined)
}

function setDataTree(data) {
	console.log(data)
	$('#tree_view').jstree(true).settings.core.data = data;
	$('#tree_view').jstree(true).load_node("#");
}

function saveTree() {
	sketchup.save_tree(dataTreeView);
}

function storeTreeView(reason) {
	// console.log("storeTreeView: " + reason)
	var data = dataTreeView()
	sketchup.store_tree_view(data, reason);
}

function dataTreeView() {
	var options = {
		no_li_attr: true,
		no_a_attr: true,
		flat: true
	};
	var flat_json = $('#tree_view').jstree(true).get_json('#', options);
	return flat_json
}

// filter select
function getSelected(full) {
	var inst = 	$('#tree_view').jstree(true);
	var checkbox = $('.jstree-checkbox').is(":visible")

	if (full != true){ full = false }

	if (checkbox){
		selected = inst.get_checked(full);
	}else{
		selected = inst.get_selected(full);
	}
	return selected
}

function getAllSketchupItemSelected(selected, full, type) {
	var inst = 	$('#tree_view').jstree(true);
	var result = []

	if (full != true){ full = false }
	if (selected === undefined){ selected = getSelected(full) }

	for (let index = 0; index < selected.length; index++) {
		const element = selected[index];
		getAllSketchupItem(inst, element, result, full, type);
	}
	return result
}

function getAllSketchupItem(inst, nodeId, result, full, type) {
	var node = inst.get_node(nodeId);
	if (full === undefined){ full = true }

	if (full == true){
		value = node
	}else{
		value = node["id"]
	}
	if (type === undefined){
		if (!result.includes(value)){
			result.push(value);
		}
	}else{
		node_type = inst.get_type(node)
		if (node_type == type && !result.includes(value)){
			result.push(value);
		}
	}
	if (node.children) {
		for (var i = 0; i < node.children.length; i++) {
			getAllSketchupItem(inst, node.children[i], result, full);
		}
	}
}

// from sketchup
function setSelectedSketchupItem(id, open) {
	console.log('setSelectedSketchupItem', id, open)
	$('.jstree-anchor').removeClass('selected')

	if (id != null){
		if (open){
			var inst = $('#tree_view').jstree(true)
			path = inst.get_path(id, null, true)
			if (path.length>1){
				for (let index = 0; index < path.length-1; index++) {
					const node = path[index];
					inst.open_node(node)
				}
			}
		}

		$('#'+id+"_anchor").addClass('selected')
	}
}

// createNode from sketchup
function createNode(node_json) {
	var inst = $('#tree_view').jstree(true);
	parent = node_json.parent
	inst.create_node(parent, node_json, "last", function (new_node) {
		setIcon(new_node, inst)
	})
	storeTreeView("createNode")
}

// createNode from sketchup
function removeNode(id) {
	$('#tree_view').jstree(true).delete_node(id)
}

// moveNode from sketchup
function moveNode(ids , parent, position) {
	if (position === undefined){ position="last" };
	$('#tree_view').jstree(true).move_node(ids, parent, position);
	storeTreeView("moveNode");
}

// rename from sketchup
function renameNode(id, new_name) {
	var node = $('#tree_view').jstree(true).get_node(id);
	$('#tree_view').jstree(true).set_text(node, new_name)
	storeTreeView("renameNode")
}

// Add Group from sketchup
function addGroup(node_json) {
	var inst = $('#tree_view').jstree(true);
	parent = node_json.parent
	inst.create_node(parent, node_json, "last", function (new_node) {
		// inst.open_node(new_node);
	})

	storeTreeView("addGroup");
}

function setIcons() {
	var data_Tree = dataTreeView();
	var inst = $('#tree_view').jstree(true)
	for (let i = 0; i < data_Tree.length; i++) {
		const node = data_Tree[i];
		setIcon(node, inst);
	}
}

function setIcon(node, inst) {
	if (inst.get_type(node) == "default"){ return };
	path = inst.get_path(node, null, true);
	if (path.length > 1 && DEFAULT_GROUPS_IDS.includes(path[0])){
		inst.set_icon(node, ICONS[path[0]]);
	}else{inst.set_icon(node, ICONS[node.type])}
}

// copy paste
function copyProp(data) {
	var inst = $.jstree.reference(data.reference),
	obj = inst.get_node(data.reference);
	var command;
	if (data.item.cmd) {
		command = data.item.cmd
	} else {
		command = data.item.label
	}
	sketchup.copy_properties(obj, command);
}

// status bar
function setStatusbar(selected){
	var inst = 	$('#tree_view').jstree(true);
	if (selected == undefined){
		var checkbox = $('.jstree-checkbox').is(":visible")
		if (checkbox){
			selected = inst.get_checked(true);
		}else{
			selected = inst.get_selected(true);
		}
	}

	// updateProp(selected);
	prop.selected = selected;
}

function sortNode(obj, deep) {
	var inst = $('#tree_view').jstree(true);
	var i, j;
	obj = inst.get_node(obj);
	if(obj && obj.children && obj.children.length) {
		obj.children.sort(function(a, b){return inst.get_text(a) > inst.get_text(b) ? 1 : -1;});

		if(deep) {
			for(i = 0, j = obj.children_d.length; i < j; i++) {
				inst.sortNode(obj.children_d[i], false);
			}
		}
	}

	inst.redraw_node(obj, true);
	storeTreeView("sortNode")
};

function sortByPrefix(group) {
	var data = group.data;
	if (!data){return;};
	prefix = data.prefix;
	if (!prefix || prefix === ""){return;};

	// get prefixes
	if (prefix.indexOf(',') != -1){
		array = prefix.split(',')
		prefixes = []
		for (let i = 0; i < array.length; i++) {
			if (array[i].length > 0){prefixes.push(array[i])}
		}
	}else{
		prefixes = [prefix]
	}

	var inst = $('#tree_view').jstree(true);

	// get node in root
	var tree = inst.get_node(group.parent)
	console.log(tree)
	var children = tree.children

	// get all sketchup_item in root
	var sketchup_items = []
	for (let i = 0; i < children.length; i++) {
		const id = children[i];
		node  = inst.get_node(id)
		if (node.type === "sketchup_item"){sketchup_items.push(node)}
	}

	var need_move = []
	for (let i = 0; i < sketchup_items.length; i++) {
		const node = sketchup_items[i];
		for (let j = 0; j < prefixes.length; j++) {
			const pf = prefixes[j];
			if (pf.substring(0,1) === '_') {
				if(node.text.substring(node.text.length-pf.length, node.text.length).toLowerCase() == pf.toLowerCase()){
					need_move.push(node)
					break;
				}
			}else if(node.text.substring(0, pf.length).toLowerCase() == pf.toLowerCase()){
				need_move.push(node)
				break;
			}
		}
	}

	// sort in group
	var children_need_move = []
	var children_group = group.children
	for (let i = 0; i < children_group.length; i++) {
		const id = children_group[i];
		node  = inst.get_node(id)
		var move = true
		if (node.type === "sketchup_item"){
			for (let j = 0; j < prefixes.length; j++) {
				const pf = prefixes[j];
				if (pf.substring(0,1) === '_') {
					if(node.text.substring(node.text.length-pf.length, node.text.length).toLowerCase() == pf.toLowerCase()){
						move = false
						break;
					}
				}else if (node.text.substring(0, pf.length).toLowerCase() == pf.toLowerCase()){
					move = false
					break;
				}
			}
		}
		if(move){children_need_move.push(node)};
	}

	inst.move_node(need_move, group)
	inst.move_node(children_need_move, group.parent, "last")
	storeTreeView("sortByPrefix")
};
