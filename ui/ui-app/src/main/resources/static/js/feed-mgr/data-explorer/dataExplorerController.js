define(['angular', "feed-mgr/data-explorer/module-name"], function (angular, moduleName) {

    var controller = function ($scope, AlationDataExplorerService) {
        var self = this;

        AlationDataExplorerService.alationSdkInit('https://kylo.trialalation.com/');

        this.openCatalog = function(){
            var alationCatalogChooser = AlationDataExplorerService.Alation.Catalog.createChooser({
                embedMethod: AlationDataExplorerService.Alation.Catalog.ChooserEmbedMethod.MODAL,  // How to open the chooser (currently MODAL or CUSTOM)
                onSelect: function (data) {},  // Callback for when user selects an object
                onCancel: function () {},  // Callback for when the user cancels
                acceptObjectTypes: []  // List of acceptable oTypes (empty == all)
            });

            alationCatalogChooser.open();
        }
    };

    angular.module(moduleName).controller('DataExplorerController', ["$scope", "AlationDataExplorerService", controller]);

});
