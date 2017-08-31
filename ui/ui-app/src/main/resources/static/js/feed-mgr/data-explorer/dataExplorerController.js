define(['angular', "feed-mgr/data-explorer/module-name"], function (angular, moduleName) {

    var controller = function ($scope, $mdDialog, $mdToast, $timeout, AlationDataExplorerService, DatasourcesService, FeedService, StateService) {
        var self = this;

        this.openCatalog = function () {
            var alationCatalogChooser = null;
            alationCatalogChooser = AlationDataExplorerService.Alation.Catalog.createChooser({
                embedMethod: AlationDataExplorerService.Alation.Catalog.ChooserEmbedMethod.MODAL,
                onSelect: function (data) {

                    /*                    var dataSourceModel = DatasourcesService.newJdbcDatasource();
                     dataSourceModel.name = data.qualifiedName;
                     dataSourceModel.description = data.qualifiedName;
                     dataSourceModel.databaseConnectionUrl = data.dataSource.jdbcUri;
                     dataSourceModel.databaseDriverClassName = "com.mysql.jdbc.Driver";
                     dataSourceModel.databaseDriverLocation = mysqlDriver;
                     dataSourceModel.databaseUser = "kylo";
                     dataSourceModel.password = "test1234";*/
                    var dataSourceExist = false;


                    //TODO move this logic to defineFeedControllerPopulated
                    DatasourcesService.findAll()
                        .then(function (datasources) {
                            datasources.forEach(function (datasource) {
                                console.log(datasource);

                                if (datasource.databaseConnectionUrl === data.dataSource.jdbcUri) {
                                    dataSourceExist = true;
                                }
                            });


                            if (!dataSourceExist) {
                                $mdDialog.show(
                                    $mdDialog.alert()
                                        .clickOutsideToClose(true)
                                        .title("Data Source is not available")
                                        .textContent("Please ask Kylo admin to add the data source " + data.dataSource.jdbcUri)
                                        .ariaLabel("Failed to add feed")
                                        .ok("Got it!")
                                );

                                alationCatalogChooser.destroy();

                                return;
                            }

                            var feedModel = FeedService.getNewCreateFeedModel();
                            feedModel.feedName = data.qualifiedName;
                            feedModel.description = data.qualifiedName;
                            StateService.FeedManager().Feed().navigateToDefineFeedPopulated("2eb2984c-cc08-4524-898d-796e5701b43f", feedModel);
                            FeedService.updateFeed(feedModel);

                        });


                    /*                    DatasourcesService.save(dataSourceModel
                     .then(function (savedModel) {
                     $mdToast.show(
                     $mdToast.simple()
                     .textContent("Successfully added data source " + dataSourceModel.name + ".")
                     .hideDelay(3000)
                     );

                     FeedService.resetFeed();

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
                     });*/

                    alationCatalogChooser.destroy();
                },  // Callback for when user selects an object
                onCancel: function () {
                },  // Callback for when the user cancels
                acceptObjectTypes: [
                    AlationDataExplorerService.Alation.Catalog.ObjectType.TABLE
                ],  // List of acceptable oTypes (empty == all)
                acceptDataSourceTypes: AlationDataExplorerService.supportedDataSourceTypes()
            });

            alationCatalogChooser.open({
                    acceptObjectTypes: [
                        AlationDataExplorerService.Alation.Catalog.ObjectType.TABLE
                    ],  // List of acceptable oTypes (empty == all)
                    acceptDataSourceTypes: AlationDataExplorerService.supportedDataSourceTypes()

                }
            );
        };

    };

    angular.module(moduleName).controller('DataExplorerController', ["$scope", "$mdDialog", "$mdToast", "$timeout", "AlationDataExplorerService", "DatasourcesService", "FeedService", "StateService", controller]);

});
