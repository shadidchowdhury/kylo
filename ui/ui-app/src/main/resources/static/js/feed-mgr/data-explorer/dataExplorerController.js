define(['angular', "feed-mgr/data-explorer/module-name"], function (angular, moduleName) {

    var controller = function ($scope, $mdDialog, $mdToast, $timeout, AlationDataExplorerService, DatasourcesService, FeedService, StateService) {
        var self = this;
        var mysqlDriver;

        this.openCatalog = function () {
            var alationCatalogChooser = null;
            alationCatalogChooser = AlationDataExplorerService.Alation.Catalog.createChooser({
                embedMethod: AlationDataExplorerService.Alation.Catalog.ChooserEmbedMethod.MODAL,
                onSelect: function (data) {
                    console.log("data is selected");
                    console.log(data);

                    var dataSourceModel = DatasourcesService.newJdbcDatasource();
                    dataSourceModel.name = data.qualifiedName;
                    dataSourceModel.description = data.qualifiedName;
                    dataSourceModel.databaseConnectionUrl = data.dataSource.jdbcUri;
                    dataSourceModel.databaseDriverClassName = "com.mysql.jdbc.Driver";
                    dataSourceModel.databaseDriverLocation = mysqlDriver;
                    dataSourceModel.databaseUser = "kylo";
                    dataSourceModel.password = "test1234";


                    DatasourcesService.save(dataSourceModel)
                        .then(function (savedModel) {
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent("Successfully added data source " + dataSourceModel.name + ".")
                                    .hideDelay(3000)
                            );

                            var feedModel = FeedService.getNewCreateFeedModel();
                            FeedService.resetFeed();
                            StateService.FeedManager().Feed().navigateToDefineFeedPopulated("2eb2984c-cc08-4524-898d-796e5701b43f");
                            feedModel.templateId = "2eb2984c-cc08-4524-898d-796e5701b43f";
                            FeedService.updateFeed(feedModel);
                            return savedModel;
                        }, function (err) {
                            $mdDialog.show(
                                $mdDialog.alert()
                                    .clickOutsideToClose(true)
                                    .title("Save Failed")
                                    .textContent("The data source '" + model.name + "' could not be saved. " + err.data.message)
                                    .ariaLabel("Failed to save data source")
                                    .ok("Got it!")
                            );
                            return error;
                        });

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

    angular.module(moduleName).controller('DataExplorerController', ["$scope", "$mdDialog", "$mdToast", "$timeout", "AlationDataExplorerService", "DatasourcesService", "FeedService", "StateService", controller]);

});
