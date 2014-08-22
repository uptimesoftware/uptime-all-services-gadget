if (typeof UPTIME == "undefined") {
	var UPTIME = {};
}

if (typeof UPTIME.ServiceStatusTable == "undefined") {
	UPTIME.ServiceStatusTable = function(options) {
		var id = "svStatusList";
		var currentAjaxParams = "";
		var ajaxParams = "";
		var alternateAjaxParams = "";
		var timeout = 30000;

		if (typeof options == "object") {
			if (typeof options.id == "string") {
				id = options.id;
			}
			if (typeof options.ajaxParams == "string") {
				ajaxParams = options.ajaxParams;
			}
			if (typeof options.alternateAjaxParams == "string") {
				alternateAjaxParams = options.alternateAjaxParams;
			}
			if (typeof options.timeout == "number") {
				timeout = options.timeout;
			}
		}

		var timer = null;
		var table = $("#" + id);

		table.bind('filterInit', function() {
			table.find('> thead .hidden').each(function(i, e) {
				var index = $(e).data("column");
				index++; // convert to 1 based index for n-thchild selector
				$(e).closest("table").find("> thead > .tablesorter-filter-row td:nth-child(" + index + ")").hide();
			});
			table.find("> thead .disabled").hide();
		});

		table.tablesorter({
			theme : "bootstrap",
			headerTemplate : "{icon} {content}",
			widgets : [ "uitheme", "saveSort", "filter", "resetIcon" ],
			sortList : [ [ 2, 1 ], [ 3, 1 ], [ 1, 0 ], [ 0, 0 ] ],
			widgetOptions : {
				filter_functions : {
					2 : {
						"Non-OK" : function(e, n, f, i) {
							return "CRIT" == e || "WARN" == e || "UNKNOWN" == e;
						},
						"Critical" : function(e, n, f, i) {
							return "CRIT" == e;
						},
						"Warning" : function(e, n, f, i) {
							return "WARN" == e;
						},
						"OK" : function(e, n, f, i) {
							return "OK" == e;
						},
						"Unknown" : function(e, n, f, i) {
							return "UNKNOWN" == e;
						},
						"Maintenance" : function(e, n, f, i) {
							return "MAINT" == e;
						}
					}
				}
			}
		});

		var alternateQueryBox = $("#" + id + "AlternateQuery");
		if (alternateQueryBox.length > 0) {
			currentAjaxParams = alternateQueryBox.is(":checked") ? alternateAjaxParams : ajaxParams;
			alternateQueryBox.change(function() {
				if (timer != null) {
					clearTimeout(timer);
				}
				currentAjaxParams = alternateQueryBox.is(":checked") ? alternateAjaxParams : ajaxParams;
				doUpdate();
			});
		} else {
			currentAjaxParams = ajaxParams;
		}

		this.start = function() {
			doUpdate();
		};

		function cellIsSame(cellHtml, rowHtml) {
			if (typeof rowHtml == "undefined" && cellHtml == "") {
				return true;
			}
			if (cellHtml == rowHtml) {
				return true;
			}
			if (cellHtml.indexOf('>') != -1 && cellHtml.replace(/[ ]?\/>/, ">") == rowHtml.replace(/[ ]?\/>/, ">")) {
				return true;
			} else if (cellHtml.trim() == rowHtml.trim()) {
				return true;
			}
			return false;
		}

		var columns = [ "monitor", "element", "status", "ack", "splunk", "lastCheck", "duration", "message" ];
		function doUpdate() {
			$.ajax('/main.php?page=GetServiceStatusTableJson' + currentAjaxParams,
					{
						cache : false,
						success : function(data, textStatus, jqXHR) {
							
							var haveData = data.length > 0;
							$("#" + id + "Loading").toggleClass("hidden", true);
							$("#" + id + "AlternateQueryContainer").toggleClass("hidden", false);
							$("#" + id + "NoData").toggleClass("hidden", haveData);
							table.toggleClass("hidden", !haveData);
							if (!haveData) {
								table.find("> tbody").empty();
								return;
							}
							var hideElement = (typeof (data[0].element) == "undefined");
							var hideSplunk = (typeof (data[0].splunk) == "undefined");
							var rowIds = {};
							var row;
							var tbody = table.find("> tbody");
							var rowsToAppend = "";
							var rowsToRemove = [];
							var changed = false;
							while (row = data.shift()) {
								var rowId = id + "_monitor_" + row.id;
								if (document.getElementById(rowId) == null) {
									rowsToAppend += '<tr id="' + rowId + '">' + '<td id="' + rowId + '_monitor" class="bold">'
											+ row.monitor + '</td>' + '<td id="' + rowId + '_element" class="'
											+ (hideElement ? 'hidden' : 'bold') + '">' + (hideElement ? '' : row.element)
											+ '</td>' + '<td id="' + rowId + '_status" class="'
											+ UPTIME.Utility.getStatusClass(row.status) + '">' + row.status + '</td>'
											+ '<td id="' + rowId + '_ack" class="IconCell">' + row.ack + '</td>' + '<td id="'
											+ rowId + '_splunk" class="' + (hideSplunk ? 'hidden' : 'IconCell') + '">'
											+ (hideSplunk ? '' : row.splunk) + '</td>' + '<td id="' + rowId + '_lastCheck">'
											+ row.lastCheck + '</td>' + '<td id="' + rowId + '_duration">' + row.duration
											+ '</td>' + '<td id="' + rowId + '_message">' + row.message + '</td>' + '</tr>';
									changed = true;
								} else {
									for ( var i = 0; i < columns.length; i++) {
										var column = columns[i];
										var cell = document.getElementById(rowId + "_" + column);
										if (cell == null) {
											// that's weird!?
											continue;
										}
										if (cellIsSame(cell.innerHTML, row[column])) {
											continue;
										}
										changed = true;
										cell.innerHTML = row[column];
										if (column == "status") {
											cell.className = UPTIME.Utility.getStatusClass(row[column]);
										}
									}
								}
								rowIds[rowId] = true;
							}
							for ( var i = 0; i < tbody[0].childNodes.length; i++) {
								if (tbody[0].childNodes[i].nodeName == 'TR' && !rowIds[tbody[0].childNodes[i].id]) {
									rowsToRemove.push(tbody[0].childNodes[i].id);
								}
							}
							if (rowsToAppend) {
								tbody.append(rowsToAppend);
							}
							$.each(rowsToRemove, function(i, e) {
								$("#" + e).remove();
							});
							table.find(".ServiceElement").toggleClass("hidden", hideElement);
							table.find(".ServiceSplunk").toggleClass("hidden", hideSplunk);
							if (changed) {
								table.trigger("update");
							}
						},
						error : function(jqXHR, textStatus, errorThrown) {
							$("#" + id + "Loading").toggleClass("hidden", true);
							$("#" + id + "AlternateQueryContainer").toggleClass("hidden", false);
							$("#" + id + "NoData").toggleClass("hidden", false);
							table.toggleClass("hidden", true);
							table.find("> tbody").empty();
							UPTIME.ErrorFullPage.showResponse(jqXHR, "Error getting status data",
									"Unexpected error getting status data");
						},
						complete : function() {
							timer = setTimeout(doUpdate, timeout);
						}
					});
		}
		;
	};

}
