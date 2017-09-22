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
    var controller =  function($scope,$q,$http,$mdToast, $interval, FeedService,VisualQueryService, DatasourcesService) {

      var self = this;
      this.alationFeed = false;

      self.feedModel = FeedService.createFeedModel;
        self.availableDatasources = [{id: VisualQueryService.HIVE_DATASOURCE, name: "Hive"}];

        self.model = VisualQueryService.model;

        init();


/*      if(feedModel.feedDescriptor == 'alationFeed'){
          self.alationFeed = true;
          if(angular.isUndefined(vqServiceModel.visualQueryModel)){
              //build it
              populateVisualQueryModelWithExample();
          }
      }*/

        function init() {
            // Get the list of data sources
            DatasourcesService.findAll()
                .then(function (datasources) {
                    Array.prototype.push.apply(self.availableDatasources, datasources);
                });

        }


        function fillDataFromAlation(){
            if(self.feedModel.feedDescriptor.length >= 2){
                var jdbcUri = self.feedModel.feedDescriptor[0];
                var tableName = self.feedModel.feedDescriptor[1];
                setAlationData(tableName, jdbcUri);
            }
        }

        function setAlationData(fullTableName, jdbcUri){;
            var schemaName = fullTableName.substring(0, fullTableName.indexOf("."));
            var tableName = fullTableName.substring(fullTableName.indexOf(".") + 1);
            var fullNameLower = fullTableName.toLowerCase();


            var matchingDataSource = _.find(self.availableDatasources, function (dataSource) {
                return 'jdbc:' + jdbcUri == dataSource.url;
            });

            if(matchingDataSource == null){
                $mdDialog.show(
                    $mdDialog.alert()
                        .clickOutsideToClose(true)
                        .title("Data source does not exist")
                        .textContent("Please add the data source url: " + 'jdbc:' + jdbcUri) // TODO add type as well
                        .ariaLabel("No matching data source configured")
                        .ok("OK")
                );
            }

            self.model.selectedDatasourceId = matchingDataSource.value;

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
            getTableSchema(table.schema, table.tableName, function(schemaData) {
                //
                // Template for a new node.
                //
                var coord = getNewXYCoord();

                angular.forEach(schemaData.fields, function(attr) {
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
                self.prepareNode(newNodeDataModel);
                self.chartViewModel.addNode(newNodeDataModel);
                validate();
            })

        };

        function newTableNodeDataModel(datasourceId,schema,table, nodeId,coord,attrs) {
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

      function newNodeAttr(name,dataType,nativeDataType,dataTypeWithPrecisionAndScale){
          if(angular.isUndefined(dataTypeWithPrecisionAndScale)) {
              dataTypeWithPrecisionAndScale = dataType;
          }
         return {
              "sampleValues": [],
              "name": name,
              "description": null,
              "nativeDataType": nativeDataType,
              "derivedDataType": dataType,
              "primaryKey": false,
              "nullable": true,
              "modifiable": true,
              "dataTypeDescriptor": null,
              "updatedTracker": false,
              "precisionScale": null,
              "createdTracker": false,
              "dataTypeWithPrecisionAndScale": dataTypeWithPrecisionAndScale,
              "descriptionWithoutNewLines": "",
              "selected": true
          };
      }

      function newSqlColumn(schema,table,tableAlias,column) {
            return  {
              "column": column,
              "alias": tableAlias,
              "tableName": schema+"."+table,
              "tableColumn": column
          };
      }


      function populateVisualQueryModelWithExample(){
          var chartDataModel = {connections:[],nodes:[]};

          var datasource ='HIVE';
          var schema = 'test'
          var table = 'example';
          //unique node id
          var nodeId = 10;
          //used for sql syntax
          var tableAlias = 'tbl10'

          //arr of attrs for the table view
          var nodeAttrs = [];

          var columnsAndTables = [];

          var columnData = [{name:"col1",dataType:'string',nativeType:'VARCHAR'},
              {name:"col2",dataType:'string',nativeType:'VARCHAR'},
              {name:"col3",dataType:'int',nativeType:'INTEGER'}];

          var sql = "";

           //build up the attrs, sql, and columns,tables
              _.each(columnData, function (col) {
                  nodeAttrs.push(newNodeAttr(col.name, col.dataType, col.nativeType));
                  columnsAndTables.push(newSqlColumn(schema,table,tableAlias,col.name));
                  //todo populate the vqServiceModel
                  //vqServiceModel.visualQuerySql = "SELECT...
              });

              var nodeTableModel = newTableNodeDataModel(datasource,schema,table,nodeId,{x:20,y:20},nodeAttrs);
            chartDataModel.nodes.push(nodeTableModel);
            vqServiceModel.visualQueryModel = chartDataModel;
            vqServiceModel.selectedColumnsAndTables = columnsAndTables;
          }

      };



var moduleName = "kylo.plugin.processor-template.dt.run-feed";
angular.module(moduleName, [])
angular.module(moduleName).controller('DataTransformationRunFeedController',["$scope","$q","$http","$mdToast","$interval","FeedService","VisualQueryService", "DatasourcesService",controller]);

angular.module(moduleName)
    .directive('kyloDataTransformRunFeedProcessor', directive);

});

