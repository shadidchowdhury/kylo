define(['angular'], function (angular) {

    var directive = function () {
        return {
            restrict: "EA",
            bindToController: {
                mode: '@',
                processor: '=',
                theForm: '='
            },
            controllerAs: 'ctl',
            scope: {},
            templateUrl: 'js/plugin/processor-templates/data-transform/run-feed/run-feed.html',
            controller: "DataTransformationRunFeedController",
            link: function ($scope, element, attrs, controllers) {
            }

        };

    }
    var controller = function ($scope, $q, $http, $mdToast, $mdDialog, $interval, FeedService, VisualQueryService, DatasourcesService) {

        var self = this;
        this.alationFeed = false;

        self.feedModel = FeedService.createFeedModel;
        self.availableDatasources = [{id: VisualQueryService.HIVE_DATASOURCE, name: "Hive"}];
        self.dataSourceControllers = [];

        self.model = VisualQueryService.model;
        self.selectedTable = {};
        self.tablesAutocomplete = {selectedTable: {}};
        var nextNodeID = 10;

        init();

        function init() {
            DatasourcesService.findAll()
                .then(function (datasources) {
                    Array.prototype.push.apply(self.availableDatasources, datasources);
                })
                .finally(function () {
                    // Fetch the list of controller services
                    FeedService.getAvailableControllerServices("org.apache.nifi.dbcp.DBCPService")
                        .then(function (services) {
                            // Update the allowable values
                            self.dataSourceControllers = _.map(services, function (service) {
                                return {
                                    name: service.name,
                                    id: service.id,
                                    url: service.properties["Database Connection URL"]
                                }
                            });

                            fillDataFromAlation();
                        }, function () {
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent('Unable to get the existing data sources.  A unexpected error occurred.')
                                    .hideDelay(3000)
                            );
                        });
                });

        }


        function fillDataFromAlation() {
            if (self.feedModel.feedDescriptor.length >= 2) {
                var jdbcUri = self.feedModel.feedDescriptor[0];
                var tableName = self.feedModel.feedDescriptor[1];
                setAlationData(tableName, jdbcUri);
            }
        }

        function setAlationData(fullTableName, jdbcUri) {
            var schemaName = fullTableName.substring(0, fullTableName.indexOf("."));
            var tableName = fullTableName.substring(fullTableName.indexOf(".") + 1);
            var fullNameLower = fullTableName.toLowerCase();


            var matchingDataSourceController = _.find(self.dataSourceControllers, function (dataSource) {
                return 'jdbc:' + jdbcUri == dataSource.url;
            });

            if (matchingDataSourceController == null) {
                $mdDialog.show(
                    $mdDialog.alert()
                        .clickOutsideToClose(true)
                        .title("Data source does not exist")
                        .textContent("Please add the data source url: " + 'jdbc:' + jdbcUri) // TODO add type as well
                        .ariaLabel("No matching data source configured")
                        .ok("OK")
                );
                return;
            }

            var selectedDataSource = _.find(self.availableDatasources, function (dataSource) {
                return matchingDataSourceController.id == dataSource.controllerServiceId;
            });

            self.model.selectedDatasourceId = selectedDataSource.id;

            self.selectedTable = self.tablesAutocomplete.selectedTable = {
                schema: schemaName,
                tableName: tableName,
                fullName: fullTableName,
                fullNameLower: fullNameLower
            };

            getTable(self.selectedTable);
        }

        function getTable(table) {

            //get attributes for table
            var datasourceId = self.model.selectedDatasourceId;
            var nodeName = table.schema + "." + table.tableName;
            getTableSchema(table.schema, table.tableName, function (schemaData) {
                //
                // Template for a new node.
                //
                var coord = getNewXYCoord();
                var chartDataModel = {connections: [], nodes: []};

                angular.forEach(schemaData.fields, function (attr) {
                    attr.selected = true;
                });
                var newNodeDataModel = {
                    name: nodeName,
                    id: nextNodeID++,
                    datasourceId: datasourceId,
                    x: coord.x,
                    y: coord.y,
                    nodeAttributes: {
                        attributes: schemaData.fields,
                        reference: [table.schema, table.tableName],
                        selected: []
                    },
                    connectors: {
                        top: {},
                        bottom: {},
                        left: {},
                        right: {}
                    },
                    inputConnectors: [
                        {
                            name: ""
                        }
                    ],
                    outputConnectors: [
                        {
                            name: ""
                        }
                    ]
                };

                chartDataModel.nodes.push(newNodeDataModel);
                self.model.visualQueryModel = chartDataModel;
            })

        };

        /**
         * Called after a user Adds a table to fetch the Columns and datatypes.
         * @param {string} schema the schema name
         * @param {string} table the table name
         * @param callback the callback function
         * @returns {HttpPromise}
         */
        function getTableSchema(schema, table, callback) {
            var promise;
            if (self.model.selectedDatasourceId === VisualQueryService.HIVE_DATASOURCE) {
                promise = $http.get(RestUrlService.HIVE_SERVICE_URL + "/schemas/" + schema + "/tables/" + table)
                    .then(function (response) {
                        return response.data;
                    });
            } else {
                promise = DatasourcesService.getTableSchema(self.model.selectedDatasourceId, table, schema);
            }

            return promise.then(callback, function () {
                self.loading = false;
            });
        }

        function newTableNodeDataModel(datasourceId, schema, table, nodeId, coord, attrs) {
            var nodeName = schema + "." + table;
            return {
                name: nodeName,
                id: nodeId,
                datasourceId: datasourceId,
                x: coord.x,
                y: coord.y,
                nodeAttributes: {
                    attributes: attrs,
                    reference: [schema, table],
                    selected: []
                },
                connectors: {
                    "top": {
                        "location": "TOP",
                        "id": 7
                    },
                    "bottom": {
                        "location": "BOTTOM",
                        "id": 8
                    },
                    "left": {
                        "location": "LEFT",
                        "id": 5
                    },
                    "right": {
                        "location": "RIGHT",
                        "id": 6
                    }
                },
                inputConnectors: [
                    {
                        name: ""
                    }
                ],
                outputConnectors: [
                    {
                        name: ""
                    }
                ],
                width: 250
            };
        }

        function getNewXYCoord() {
            var coord = {x: 20, y: 20};
            return coord;
        }

        /**
         * Adds utility functions to a node data model.
         *
         * @param {Object} node the node data model
         */
        this.prepareNode = function (node) {
            /**
             * Indicates if all of the attributes are selected.
             *
             * @returns {boolean} {@code true} if all attributes are selected, or {@code false} otherwise
             */
            node.nodeAttributes.hasAllSelected = function () {
                return _.every(this.attributes, function (attr) {
                    return attr.selected
                });
            };

            /**
             * Selects the specified attribute.
             *
             * @param {Object} attr the attribute to be selected
             */
            node.nodeAttributes.select = function (attr) {
                attr.selected = true;
                this.selected.push(attr);
                validate();
            };

            /**
             * Selects all attributes.
             */
            node.nodeAttributes.selectAll = function () {
                var selected = [];
                angular.forEach(this.attributes, function (attr) {
                    attr.selected = true;
                    selected.push(attr);
                });
                this.selected = selected;
                validate();
            };

            /**
             * Deselects the specified attribute.
             *
             * @param {Object} attr the attribute to be deselected
             */
            node.nodeAttributes.deselect = function (attr) {
                attr.selected = false;
                var idx = this.selected.indexOf(attr);
                if (idx > -1) {
                    this.selected.splice(idx, 1);
                }
                validate();
            };

            /**
             * Deselects all attributes.
             */
            node.nodeAttributes.deselectAll = function () {
                angular.forEach(this.attributes, function (attr) {
                    attr.selected = false;
                });
                this.selected = [];
                validate();
            };
        };

    };


    var moduleName = "kylo.plugin.processor-template.dt.run-feed";
    angular.module(moduleName, [])
    angular.module(moduleName).controller('DataTransformationRunFeedController', ["$scope", "$q", "$http", "$mdToast", "$mdDialog", "$interval", "FeedService", "VisualQueryService", "DatasourcesService", controller]);

    angular.module(moduleName)
        .directive('kyloDataTransformRunFeedProcessor', directive);

});

