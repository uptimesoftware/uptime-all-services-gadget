$(function() {
        function editSettings(settings) {

            //$("#AllServicesView").hide();
            $("#EditBar").show();
            $("#edit").show();


        }

        function doError(status) {
            $("#error").empty();
            uptimeErrorFormatter.getErrorBox(status, "Error communicating with Uptime").appendTo('#error');
            $("#error").slideDown();
            $("#save").prop("disabled", false);
        }

        function doRender(settings) {
        $("#EditBar").hide();
        $("#edit").hide();
        //$("#AllServicesView").show();
                var serviceStatusTable = new UPTIME.ServiceStatusTable({
                    id : "allServicesList",
                    ajaxParams : "&queryName=GET_STATUS",
                    timeout : 60000,
                    alternateAjaxParams : "&queryName=GET_STATUS&queryParameter=hideOk&queryValue=true"             });
                serviceStatusTable.start();
        }

        $("#save").click(function() {
            var settings = {
                test: "test"
            };
            uptimeGadget.saveSettings(settings).then(doRender, doError);
            $("#EditBar").hide();
            $("#edit").hide();
            //$("#AllServicesView").show();

        });



        uptimeGadget.registerOnResizeHandler(function(dimensions) {
            $("body").height(dimensions.height).width(dimensions.width);
        });
        uptimeGadget.registerOnEditHandler(function() {
            $("#EditBar").hide();
            $("#edit").hide();
            //$("#AllServicesView").show();
            uptimeGadget.loadSettings().then(function(settings) {
                editSettings(settings);
            });
        });
        uptimeGadget.registerOnLoadHandler(function(onLoadData) {
            $("#AllServicesView").data("dimensions", onLoadData.dimensions);
            if (onLoadData.hasPreloadedSettings()) {
                doRender(onLoadData.settings);
            } else {
                uptimeGadget.loadSettings(doRender, doError);
            }
        });
});