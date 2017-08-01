define(['angular', "feed-mgr/data-explorer/module-name"], function (angular, moduleName) {

    var controller = function ($scope, AlationDataExplorerService) {
        var self = this;

        AlationDataExplorerService.alationSdkInit('https://kylo.trialalation.com/');

        this.openCatalog = function () {
            var alationCatalogChooser = null;
            alationCatalogChooser = AlationDataExplorerService.Alation.Catalog.createChooser({
                embedMethod: AlationDataExplorerService.Alation.Catalog.ChooserEmbedMethod.MODAL,
                onSelect: function (data) {
                    console.log("data is selected");
                    console.log(data);

                    alationCatalogChooser.destroy();
                },  // Callback for when user selects an object
                onCancel: function () {
                },  // Callback for when the user cancels
                acceptObjectTypes: [
                    AlationDataExplorerService.Alation.Catalog.ObjectType.TABLE
                ],  // List of acceptable oTypes (empty == all)
                acceptDataSourceTypes: [
                    AlationDataExplorerService.Alation.DataSourceType.MYSQL
                ]
            });

            alationCatalogChooser.open({
                acceptObjectTypes: [
                    AlationDataExplorerService.Alation.Catalog.ObjectType.TABLE
                ],  // List of acceptable oTypes (empty == all)
                acceptDataSourceTypes: [
                    AlationDataExplorerService.Alation.DataSourceType.MYSQL
                ]
                }
            );
        };

    };

    angular.module(moduleName).controller('DataExplorerController', ["$scope", "AlationDataExplorerService", controller]);

});
