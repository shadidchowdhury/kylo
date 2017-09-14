/*-
 * #%L
 * thinkbig-ui-feed-manager
 * %%
 * Copyright (C) 2017 ThinkBig Analytics
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */

define(['angular'], function (angular) {

    var directive = function () {
        return {
            restrict: "EA",
            bindToController: {
                mode: '@',
                processor: '=',
                theForm: '=',
                sourceTableKey: '@?',
                sourceFieldsKey: '@?',
                connectionServiceKey: '@?',
                loadStrategyKey: '@?',
                incrementalPropertyKey: '@?',
                renderLoadStrategyOptions: '=',
                loadStrategyOptions: '=?',
                defaultLoadStrategyValue: '@?',
                useTableNameOnly: '=?'
            },
            controllerAs: 'ctl',
            scope: {},
            templateUrl: 'js/plugin/processor-templates/GetTableDataAlation/get-table-data-properties.html',
            controller: "GetTableDataPropertiesController",
            link: function ($scope, element, attrs, controllers) {
            }

        };
    }

    var service = function ($http, RestUrlService) {

        var ALATION_DRIVER_LOCATION_PROPERTY = 'alation.driverLocation.';
        var ALATION_DATASOURCE_TYPES_PROPERTY = 'alation.acceptedDatasourceTypes';
        var ALATION_URL_PROPERTY = 'alation.url';
        var CONFIG_API = '/proxy/v1/configuration/properties';

        var data = {
            init: function () {
                this.fetchConfigurationProperties();
            },
            configurationProperties: [],
            configurationPropertyMap: {},

            // TODO:  Should be fetched instead <script type="text/javascript" src="<scheme>://<domain>:<port>/integration/catalog_chooser/v1/sdk.js" />

            supportedDataSourceTypes: function () {
                //return this.configurationPropertyMap[ALATION_DATASOURCE_TYPES_PROPERTY].split(",");
                return "mysql, mariadb".split(",");
            },

            dataSourceDriverLocation: function (dataSourceType) {
                return this.configurationPropertyMap[ALATION_DRIVER_LOCATION_PROPERTY + dataSourceType];
            },

            alationSdkInit: function (alationBaseUrl) {

                alationBaseUrl = alationBaseUrl.replace(/\/$/, ""); // Remove trailing /, if it exists.

                var ChooserEmbedMethod = Object.freeze({
                    MODAL: 'MODAL',
                    CUSTOM: 'CUSTOM'
                });

                var ObjectType = Object.freeze({
                    DATA_SOURCE: 'data',
                    SCHEMA: 'schema',
                    TABLE: 'table',
                    COLUMN: 'attribute',
                    QUERY: 'query'
                });

                var DataSourceType = Object.freeze({
                    BIGQUERY: 'bigquery',
                    DB2: 'db2',
                    GREENPLUM: 'greenplum',
                    HIVE2: 'hive2',
                    IMPALA: 'impala',
                    MYSQL: 'mysql',
                    NETEZZA: 'netezza',
                    ORACLE: 'oracle',
                    ORIENT: 'orient',
                    POSTGRESQL: 'postgresql',
                    PRESTO: 'presto',
                    REDSHIFT: 'redshift',
                    SAP: 'sap',
                    SAS: 'sas',
                    SNOWFLAKE: 'snowflake',
                    SQLITE: 'sqlite',
                    SQLSERVER: 'sqlserver',
                    SYBASE: 'sybase',
                    TERADATA: 'teradata',
                    TERADATAASTER: 'teradataaster',
                    VERTICA: 'vertica'
                });

                var STYLESHEET_ID = 'alation-catalog-chooser-styles';
                var CHOOSER_SDK_URL = '/static/integration/catalog_chooser/v1';
                var CHOOSER_IFRAME_CLASS = 'alation-catalog-chooser';
                var CHOOSER_MODAL_CLASS = 'alation-catalog-chooser-modal';
                var CHOOSER_MODAL_BACKDROP_CLASS = 'alation-catalog-chooser-modal-backdrop';

                var getAlationUrl = function (path) {
                    var url = alationBaseUrl;
                    if (path.length > 0 && path[0] !== '/') {
                        url += '/';
                    }
                    return url + path;
                };

                var getAlationChooserSdkFileUrl = function (filename) {
                    return getAlationUrl(CHOOSER_SDK_URL + '/' + filename);
                };

                /**
                 * View with a
                 * @param {Object} options
                 *  - embedMethod
                 *  - onSelect
                 *  - onCancel
                 *  - acceptObjectTypes
                 *  - acceptDataSourceTypes
                 */
                var CatalogChooser = function (options) {
                    this.options = options;

                    this.element = initIframe(options.acceptObjectTypes, options.acceptDataSourceTypes);
                    this._listeners = {
                        onSelect: [options.onSelect],
                        onCancel: [this.destroy.bind(this), options.onCancel]
                    };
                    this._handler = bindEventListeners(this._listeners);
                };

                CatalogChooser.prototype = {
                    open: function () {
                        if (!this.element) {
                            throw Error("Cannot open a chooser that was already destroyed");
                        }
                        ensureStyleSheetIncluded();
                        this.modalElements = createModal(this.element);
                        openModal(this.modalElements.modal);
                    },
                    destroy: function () {
                        var removeIfExists = function (el) {
                            if (el) {
                                el.remove();
                            }
                        };
                        removeIfExists(this.element);
                        this.element = null;
                        removeIfExists(this.modalElements.modal);
                        removeIfExists(this.modalElements.backdrop);
                        this.modalElements = null;
                        unbindEventListener(this._handler);
                    },
                    onSelect: function (handler) {
                        this._listeners.onSelect.push(handler);
                    },
                    onCancel: function (handler) {
                        this._listeners.onCancel.push(handler);
                    }
                };

                var ensureStyleSheetIncluded = function (chooser) {
                    // Check if the link is already there and if so abort.
                    var stylesheet = document.getElementById(STYLESHEET_ID);

                    if (stylesheet) {
                        return;
                    }

                    // create the link
                    stylesheet = document.createElement('link');
                    stylesheet.setAttribute('id', STYLESHEET_ID);
                    stylesheet.setAttribute('rel', 'stylesheet');
                    stylesheet.setAttribute('type', 'text/css');
                    stylesheet.setAttribute('href', getAlationChooserSdkFileUrl('style.css'));
                    document.head.appendChild(stylesheet);
                };

                var initIframe = function (acceptObjectTypes, acceptDataSourceTypes) {
                    var path = '/catalog_chooser/';
                    if (acceptObjectTypes) {
                        path += '?accept_object_types=' + encodeURIComponent(acceptObjectTypes.join(','));
                    }
                    if (acceptDataSourceTypes) {
                        var joinChar = path.indexOf('?') < 0 ? '?' : '&';
                        path += (
                            joinChar + 'accept_data_source_types=' +
                            encodeURIComponent(acceptDataSourceTypes.join(','))
                        );
                    }

                    // Create iframe.
                    var iframe = document.createElement('iframe');
                    iframe.setAttribute('class', CHOOSER_IFRAME_CLASS);
                    iframe.setAttribute('src', getAlationUrl(path));
                    return iframe;
                };

                var bindEventListeners = function (listeners) {
                    // Create and add listener that listens to messages from iframe.
                    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
                    var listener = window[eventMethod];
                    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

                    var callListeners = function (listenerArray, args) {
                        for (var i = 0; i < listenerArray.length; i++) {
                            if (listenerArray[i]) {
                                try {
                                    listenerArray[i].apply(null, args);
                                } catch (e) {
                                    console.error("Error in event handler", e);
                                }
                            }
                        }
                    };

                    // Listen to messages from iframe.
                    // TODO: validate source url to prevent receiving data from just anywhere.
                    var messageHandler = function (e) {
                        var data = JSON.parse(e.data);
                        if (data.cancel) {
                            callListeners(listeners.onCancel);
                        } else {
                            callListeners(listeners.onSelect, [data]);
                        }
                    };

                    listener(messageEvent, messageHandler, false);

                    return messageHandler;
                };

                var unbindEventListener = function (handler) {
                    // Create and add listener that listens to messages from iframe.
                    var eventMethod = window.removeEventListener ? "removeEventListener" : "detachEvent";
                    var unlistener = window[eventMethod];
                    var messageEvent = eventMethod == "detachEvent" ? "onmessage" : "message";

                    unlistener(messageEvent, handler);
                };

                var createModal = function (iframe) {
                    var div = document.createElement('div');
                    div.setAttribute('class', CHOOSER_MODAL_CLASS);
                    div.appendChild(iframe);
                    iframe.setAttribute('width', '100%');
                    iframe.setAttribute('height', '100%');
                    var backdropDiv = document.createElement('div');
                    backdropDiv.setAttribute('class', CHOOSER_MODAL_BACKDROP_CLASS);
                    document.body.appendChild(backdropDiv);
                    document.body.appendChild(div);
                    return {
                        modal: div,
                        backdrop: backdropDiv
                    };
                };

                var openModal = function (modalDiv) {
                    modalDiv.classList += " in";
                };

                this.Alation = {
                    DataSourceType: DataSourceType,
                    Catalog: {
                        createChooser: function (options) {
                            return new CatalogChooser(options);
                        },
                        ChooserEmbedMethod: ChooserEmbedMethod,
                        ObjectType: ObjectType
                    }
                };
            },

            fetchConfigurationProperties: function (successFn, errorFn) {
                var self = this;
                if (self.configurationProperties.length == 0) {
                    var _successFn = function (response) {
                        self.configurationProperties = response.data;
                        angular.forEach(response.data, function (value, key) {
                            self.configurationPropertyMap[key] = value; //TODO read only alation properties
                        })
                        //data.alationSdkInit(self.configurationPropertyMap[ALATION_URL_PROPERTY]);
                        data.alationSdkInit("https://kylo.trialalation.com/");

                        if (successFn) {
                            successFn(response);
                        }
                    }
                    var _errorFn = function (err) {
                        if (errorFn) {
                            errorFn(err)
                        }
                    }

                    var promise = $http.get(CONFIG_API);
                    promise.then(_successFn, _errorFn);
                    return promise;
                }
            }
        };

        data.init();
        return data;
    }

    var controller = function ($scope, $q, $http, $mdToast, RestUrlService, FeedService, EditFeedNifiPropertiesService, DBCPTableSchemaService, AlationDataExplorerService) {

        var self = this;
        /**
         * The object storing the table selected via the autocomplete
         * @type {null}
         */
        this.selectedTable = null;

        /**
         * The table Schema, parsed from the table autocomplete
         * @type {null}
         */
        this.tableSchema = null;

        /**
         * If we are creating a new feed then use the Create Model, otherwise use the Edit Model
         * If the processor is undefined, attempt to get it via the inputProcessor of the model
         */
        if (this.mode == 'create') {
            if (this.processor == undefined) {
                this.processor = FeedService.createFeedModel.inputProcessor;
            }

            this.model = FeedService.createFeedModel;
        }
        else {
            if (this.processor == undefined) {
                this.processor = EditFeedNifiPropertiesService.editFeedModel.inputProcessor;
            }
            this.model = EditFeedNifiPropertiesService.editFeedModel;

        }

        /**
         * Cache of the Table objects returned from the initial autocomplete call out
         * @type {{}}
         */
        this.allTables = {};

        /**
         * Flag to indicate if the controller service has connection errors.
         * if there are erros the UI will display input boxes for the user to defin the correct table name
         * @type {boolean}
         */
        this.databaseConnectionError = false;

        /**
         *  load strategies either passed in via the directive, or defaulted
         */
        this.loadStrategyOptions =
            angular.isDefined(this.loadStrategyOptions) ? this.loadStrategyOptions : [{
                name: 'Full Load',
                type: 'SNAPSHOT',
                strategy: 'FULL_LOAD',
                hint: 'Replace entire table'
            }, {
                name: 'Incremental', type: 'DELTA', strategy: 'INCREMENTAL', hint: 'Incremental load'
                + ' based on a '
                + ' high watermark', incremental: true, restrictDates: true
            }];

        /**
         * Default the property keys that are used to look up the
         *
         */

        this.SOURCE_TABLE_PROPERTY_KEY = angular.isDefined(this.sourceTableKey) ? this.sourceTableKey : 'Source Table';
        this.SOURCE_FIELDS_PROPERTY_KEY = angular.isDefined(this.sourceFieldsKey) ? this.sourceFieldsKey : 'Source Fields';
        this.DB_CONNECTION_SERVICE_PROPERTY_KEY = angular.isDefined(this.connectionServiceKey) ? this.connectionServiceKey : 'Source Database Connection'; //''
        this.LOAD_STRATEGY_PROPERTY_KEY = angular.isDefined(this.loadStrategyKey) ? this.loadStrategyKey : 'Load Strategy';
        this.INCREMENTALPROPERTY_KEY = angular.isDefined(this.incrementalPropertyKey) ? this.incrementalPropertyKey : 'Date Field';
        this.defaultLoadStrategyValue = angular.isDefined(this.defaultLoadStrategyValue) ? this.defaultLoadStrategyValue : 'INCREMENTAL';
        this.dbConnectionProperty = findProperty(self.DB_CONNECTION_SERVICE_PROPERTY_KEY, false)
        this.useTableNameOnly = angular.isDefined(this.useTableNameOnly) ? this.useTableNameOnly : false;
        /**
         * The 2 properties are not used right now
         */
        this.RETENTION_PERIOD_PROPERTY_KEY = 'Backoff Period';
        this.ARCHIVE_UNIT_PROPERTY_KEY = 'Minimum Time Unit';

        /**
         * Cache of the fields related to the table selected
         * This is used the the dropdown when showing the fields for the incremtal options
         * @type {Array}
         */
        this.tableFields = [];

        /**
         * property that stores the selected table fields and maps it to the hive table schema
         * @type {Array}
         */
        this.originalTableFields = [];

        /**
         * Array of the Nifi property keys that are marked as custom.  any keys here will not be loaded by the default nifi-property rendering  mechanism and be required to be implemented by this
         * template.
         * @type {*[]}
         */
        var customPropertyKeys = [self.DB_CONNECTION_SERVICE_PROPERTY_KEY, self.SOURCE_TABLE_PROPERTY_KEY, self.SOURCE_FIELDS_PROPERTY_KEY, self.LOAD_STRATEGY_PROPERTY_KEY,
            self.INCREMENTALPROPERTY_KEY, self.RETENTION_PERIOD_PROPERTY_KEY, self.ARCHIVE_UNIT_PROPERTY_KEY];

        /**
         * lookup and find the respective Nifi Property objects that map to the custom property keys
         */
        initPropertyLookup();

        /**
         * lookup and find the respective Nifi Property objects that map to the custom property keys
         */
        function initPropertyLookup() {
            self.tableProperty = findProperty(self.SOURCE_TABLE_PROPERTY_KEY);
            self.fieldsProperty = findProperty(self.SOURCE_FIELDS_PROPERTY_KEY);
            self.loadStrategyProperty = findProperty(self.LOAD_STRATEGY_PROPERTY_KEY);
            if (self.loadStrategyProperty && (self.loadStrategyProperty.value == null || self.loadStrategyProperty.value == undefined)) {
                self.loadStrategyProperty.value = self.defaultLoadStrategyValue;
            }


            self.retentionPeriodProperty = findProperty(self.RETENTION_PERIOD_PROPERTY_KEY);
            self.archiveUnitProperty = findProperty(self.ARCHIVE_UNIT_PROPERTY_KEY);

            self.deleteSourceProperty = {value: 'false', key: 'Delete Source'};
            self.incrementalFieldProperty = findProperty(self.INCREMENTALPROPERTY_KEY);
        }


        /**
         * Check to see if the property is in the list of custom ones.
         * if so it will bypass the nifi-property directive for rendering
         * @param property
         * @returns {boolean|*}
         */
        this.isCustomProperty = function (property) {
            return _.contains(customPropertyKeys, property.key);
        }

        /**
         * Determine if the incoming value or if the current selected LoadStrategy is of type incremental
         * Incremental properties need additional option to define the field used for incrementing
         * @param val
         * @returns {*|{}}
         */
        this.isIncrementalLoadStrategy = function (val) {
            var checkValue = val;
            if (checkValue == undefined) {
                checkValue = (self.loadStrategyProperty) ? self.loadStrategyProperty.value : undefined;
            }

            return checkValue && _.find(self.loadStrategyOptions, function (v) {
                    return v.strategy == checkValue && v.incremental == true;
                });
        }

        /**
         * Change listener when the user changes the controller service in the UI
         * @param dbConnectionProperty
         */
        this.onDbConnectionPropertyChanged = function (dbConnectionProperty) {
            if (self.mode != 'edit') {

                //clear out rest of the model
                self.selectedTable = undefined;
                self.model.table.sourceTableIncrementalDateField = null;
                self.databaseConnectionError = false;
            }

        }


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

                    var fullTableName = data.qualifiedName;
                    var dataSource = data.dataSource;

                    var schemaName = fullTableName.substring(0, fullTableName.indexOf("."));
                    var tableName = fullTableName.substring(fullTableName.indexOf(".") + 1);
                    var fullNameLower = fullTableName.toLowerCase();


                    self.selectedTable = {
                        schema: schemaName,
                        tableName: tableName,
                        fullName: fullTableName,
                        fullNameLower: fullNameLower
                    };

                    //StateService.FeedManager().Feed().navigateToDefineFeedPopulated(data.qualifiedName, data.dataSource);

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

        /**
         * Change listener when the user updates a NiFi property in UI
         *
         * Currently, this handles the output type property specified by the user for a database ingest feed
         * This is used to set the Hive table's format

         * @param nifiPropertyChanged
         */
        this.onNiFiPropertyChanged = function (nifiPropertyChanged) {
            if (self.mode == 'create') {
                if (nifiPropertyChanged.key == 'Output Type') {
                    if (nifiPropertyChanged.value == 'AVRO') {
                        self.model.table.feedFormat = 'STORED AS AVRO'
                    }
                    else if (nifiPropertyChanged.value == 'DELIMITED') {
                        self.model.table.feedFormat = FeedService.getNewCreateFeedModel().table.feedFormat
                    }
                }
            }
        };

        /**
         * Finds the correct NiFi processor Property associated with the incoming key.
         *
         * @param key
         * @param clone
         * @returns {*}
         */
        function findProperty(key, clone) {
            //get all the props for this input

            if (clone == undefined) {
                clone = false;
            }
            var matchingProperty = _.find(self.processor.allProperties, function (property) {
                return property.key == key;
            });

            //on edit mode the model only has the props saved for that type.
            //need to find the prop associated against the other input type
            if ((matchingProperty == undefined || matchingProperty == null) && self.model.allInputProcessorProperties != undefined) {
                var props = self.model.allInputProcessorProperties[self.processor.processorId];
                if (props) {
                    matchingProperty = _.find(props, function (property) {
                        return property.key == key;
                    });
                }
            }
            if (matchingProperty == null) {
                //  console.log('UNABLE TO GET MATCHING PROPERTY FOR ',key,'model ',self.model, self.processor)
            } else {
                if (clone) {
                    return angular.copy(matchingProperty);
                }
            }

            return matchingProperty;
        }

        /**
         * match query term case insensitive
         * @param query
         * @returns {Function}
         */
        function createFilterForTable(query) {
            var lowercaseQuery = angular.lowercase(query);
            return function filterFn(item) {
                return (item.fullNameLower.indexOf(lowercaseQuery) != -1 );
            };
        }

        /**
         * return the list of tables for the selected Service ID
         * @param query
         * @returns {*}
         */
        function queryTablesSearch(query) {
            var dbcpProperty = self.dbConnectionProperty;
            if (dbcpProperty != null && dbcpProperty.value != null) {
                var serviceId = dbcpProperty.value;
                var serviceNameValue = _.find(dbcpProperty.propertyDescriptor.allowableValues, function (allowableValue) {
                    return allowableValue.value == serviceId;
                });
                var serviceName = serviceNameValue != null && serviceNameValue != undefined ? serviceNameValue.displayName : '';

                if (query == null) {
                    query = '';
                }
                //add % if not ends with

                if (self.allTables[serviceId] == undefined) {
                    var deferred = $q.defer();
                    var tableNameQuery = "%" + query + "%";
                    var tables = $http.get(DBCPTableSchemaService.LIST_TABLES_URL(serviceId), {
                        params: {
                            serviceName: serviceName,
                            tableName: tableNameQuery
                        }
                    }).then(function (response) {
                        self.databaseConnectionError = false;
                        var tables = parseTableResponse(response.data);
                        // Dont cache .. uncomment to cache results
                        // self.allTables[serviceId] = parseTableResponse(response.data);
                        var results = query ? tables.filter(createFilterForTable(query)) : tables;
                        deferred.resolve(results);
                    }, function (err) {
                        self.databaseConnectionError = true;

                    });
                    return deferred.promise;
                }
                else {
                    var results = query ? self.allTables[serviceId].filter(createFilterForTable(query)) : [];

                    return results;
                }
            }
            else {
                return [];
            }
        }

        /**
         * Turn the schema.table string into an object for template display
         * @param response
         * @returns {Array}
         */
        function parseTableResponse(response) {
            var allTables = [];
            if (response) {
                angular.forEach(response, function (table) {
                    var schema = table.substr(0, table.indexOf("."));
                    var tableName = table.substr(table.indexOf(".") + 1);
                    allTables.push({
                        schema: schema,
                        tableName: tableName,
                        fullName: table,
                        fullNameLower: table.toLowerCase()
                    });
                })
            }
            return allTables;
        }

        /**
         * Autocomplete objected used in the UI html page
         * @type {{clear: Function, searchText: string, selectedTable: null, searchTextChange: Function, selectedItemChange: Function, querySearch: Function}}
         */
        this.tablesAutocomplete = {
            clear: function () {
                this.searchText = '';
                this.selectedTable = null;
            },
            searchText: '',
            selectedTable: null,
            searchTextChange: function (text) {
                validate();

            },
            selectedItemChange: function (table) {
                self.selectedTable = table;
                validate();
            },
            querySearch: function (txt) {
                return queryTablesSearch(txt);
            }
        }

        /**
         * if we are editing then get the selectedTable saved on this model.
         */
        if (this.mode == 'edit') {
            var processorTableName = this.model.table.existingTableName;
            this.tablesAutocomplete.selectedTable = this.model.table.existingTableName;
            if (processorTableName != null) {
                var schemaName = processorTableName.substring(0, processorTableName.indexOf("."));
                var tableName = processorTableName.substring(processorTableName.indexOf(".") + 1);
                var fullNameLower = processorTableName.toLowerCase();
                this.selectedTable = this.tablesAutocomplete.selectedTable = {
                    schema: schemaName,
                    tableName: tableName,
                    fullName: processorTableName,
                    fullNameLower: fullNameLower
                };
            }
            if (self.isIncrementalLoadStrategy()) {
                editIncrementalLoadDescribeTable();
            }
        }

        /**
         * Callback from saving/edit feed
         */
        function onSaveSuccessEditNifiProperties(model) {
            //update the model with the properties
        }

        /**
         * on edit describe the table for incremental load to populate the tableField options
         */
        function editIncrementalLoadDescribeTable() {
            //get the property that stores the DBCPController Service
            var dbcpProperty = self.dbConnectionProperty;
            if (dbcpProperty != null && dbcpProperty.value != null && self.selectedTable != null) {
                var successFn = function (response) {
                    self.databaseConnectionError = false;
                    self.tableSchema = response.data;
                    self.tableFields = self.tableSchema.fields;
                };

                var serviceId = dbcpProperty.value;
                var serviceNameValue = _.find(dbcpProperty.propertyDescriptor.allowableValues, function (allowableValue) {
                    return allowableValue.value == serviceId;
                });
                var serviceName = serviceNameValue != null && serviceNameValue != undefined ? serviceNameValue.displayName : '';
                var promise = $http.get(DBCPTableSchemaService.DESCRIBE_TABLE_URL(serviceId, self.selectedTable.tableName), {
                    params: {
                        schema: self.selectedTable.schema,
                        serviceName: serviceName
                    }
                })
                promise.then(successFn, function (err) {
                    self.databaseConnectionError = true;
                });
                return promise;
            }
        }

        /**
         * Describe the table
         * This is called once a user selects a table from the autocomplete
         * This will setup the model populating the destination table fields
         * @returns {HttpPromise}
         */
        function describeTable() {
            //get the property that stores the DBCPController Service
            var dbcpProperty = self.dbConnectionProperty;
            if (dbcpProperty != null && dbcpProperty.value != null && self.selectedTable != null) {
                var successFn = function (response) {
                    self.databaseConnectionError = false;

                    self.tableSchema = response.data;
                    self.tableFields = self.tableSchema.fields;
                    self.originalTableFields = angular.copy(self.tableSchema.fields);
                    self.tableFieldsDirty = false;

                    self.model.table.sourceTableSchema.fields = self.originalTableFields;

                    FeedService.setTableFields(self.tableSchema.fields);
                    self.model.table.method = 'EXISTING_TABLE';

                    if (self.tableSchema.schemaName != null) {
                        self.model.table.existingTableName = self.tableSchema.schemaName + "." + self.tableSchema.name;
                    }
                    else {
                        self.model.table.existingTableName = self.tableSchema.name;
                    }
                    self.model.table.sourceTableSchema.name = self.model.table.existingTableName;
                }

                var serviceId = dbcpProperty.value;
                var serviceNameValue = _.find(dbcpProperty.propertyDescriptor.allowableValues, function (allowableValue) {
                    return allowableValue.value == serviceId;
                });
                var serviceName = serviceNameValue != null && serviceNameValue != undefined ? serviceNameValue.displayName : '';
                var promise = $http.get(DBCPTableSchemaService.DESCRIBE_TABLE_URL(serviceId, self.selectedTable.tableName), {
                    params: {
                        schema: self.selectedTable.schema,
                        serviceName: serviceName
                    }
                })
                promise.then(successFn, function (err) {
                    self.databaseConnectionError = true;
                });
                return promise;

            }
        }

        this.onManualTableNameChange = function () {
            if (self.model.table.method != 'EXISTING_TABLE') {
                self.model.table.method = 'EXISTING_TABLE';
            }
            self.model.table.sourceTableSchema.name = self.tableProperty.value
            self.model.table.existingTableName = self.tableProperty.value;
        }

        this.onManualFieldNameChange = function () {
            if (self.model.table.method != 'EXISTING_TABLE') {
                self.model.table.method = 'EXISTING_TABLE';
            }
            var fields = [];
            var val = self.fieldsProperty.value;
            var fieldNames = [];
            _.each(val.split(","), function (field) {
                var col = FeedService.newTableFieldDefinition();
                col.name = field.trim();
                col.derivedDataType = 'string';
                fields.push(col);
                fieldNames.push(col.name);
            });
            self.model.table.sourceTableSchema.fields = angular.copy(fields);
            FeedService.setTableFields(fields);

            self.model.table.sourceFieldsCommaString = fieldNames.join(",")
            self.model.table.sourceFields = fieldNames.join("\n")

        }

        /**
         * Filter for fields that are Date types
         * @param field
         * @returns {boolean}
         */
        this.filterFieldDates = function (field) {
            return field.derivedDataType == 'date' || field.derivedDataType == 'timestamp';
        }


        this.onIncrementalDateFieldChange = function () {
            var prop = self.incrementalFieldProperty;
            if (prop != null) {
                prop.value = self.model.table.sourceTableIncrementalDateField;
                prop.displayValue = prop.value;
            }
        }

        /**
         * Validates the autocomplete has a selected table
         */
        function validate() {
            if (self.theForm != undefined && self.theForm.tableAutocompleteInput) {

                if (self.selectedTable == undefined) {
                    self.theForm.tableAutocompleteInput.$setValidity("required", false);
                }
                else {
                    self.theForm.tableAutocompleteInput.$setValidity("required", true);
                }
            }
        }


        /**
         * Watch for changes on the table to refresh the schema
         */
        $scope.$watch(function () {
            return self.selectedTable
        }, function (newVal) {
            var tableProperty = self.tableProperty
            validate();
            if (tableProperty && newVal != undefined) {

                if (self.useTableNameOnly) {
                    tableProperty.value = newVal.tableName;
                }
                else {
                    tableProperty.value = newVal.fullName;
                }


                if (newVal != null && newVal != undefined) {
                    if (self.mode == 'create') {
                        //only describe on the Create as the Edit will be disabled and we dont want to change the field data
                        describeTable();
                    }
                }
                else {
                    self.tableSchema = null;
                }
            }
        })

        /**
         * If there is a LOAD_STRATEGY property then watch for changes to show/hide additional options
         */
        if (self.loadStrategyProperty) {
            $scope.$watch(function () {
                return self.loadStrategyProperty.value
            }, function (newVal, oldValue) {
                self.loadStrategyProperty.displayValue = newVal
                if (newVal == 'FULL_LOAD') {
                    self.model.table.tableType = 'SNAPSHOT';
                    self.restrictIncrementalToDateOnly = false;
                }
                else if (self.isIncrementalLoadStrategy(newVal)) {
                    self.model.table.tableType = 'DELTA';
                    //reset the date field
                    if (oldValue != undefined && oldValue != null && newVal != oldValue) {
                        self.model.table.sourceTableIncrementalDateField = '';
                    }
                    var option = _.find(self.loadStrategyOptions, function (opt) {
                        return opt.strategy == newVal
                    });
                    if (option) {
                        self.restrictIncrementalToDateOnly = option.restrictDates != undefined ? option.restrictDates : false;
                    }
                    if (newVal !== oldValue) {
                        editIncrementalLoadDescribeTable();
                    }
                }

            });
        }

    };

    var moduleName = "kylo.plugin.processor-template.tabledata";
    angular.module(moduleName, [])
    angular.module(moduleName).controller('GetTableDataPropertiesController', ["$scope", "$q", "$http", "$mdToast", "RestUrlService", "FeedService", "EditFeedNifiPropertiesService", "DBCPTableSchemaService", "AlationDataExplorerService", controller]);


    angular.module(moduleName).service('AlationDataExplorerService', ['$http', 'RestUrlService', service]);
    angular.module(moduleName)
        .directive('thinkbigGetTableDataProperties', directive);

});


