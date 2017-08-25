define(['angular', 'services/module-name'], function (angular, moduleName) {
    angular.module(moduleName).service('AlationDataExplorerService', ['$http', 'RestUrlService', function ($http, RestUrlService) {

        var data = {
            init: function () {
                this.fetchConfigurationProperties();
            },
            configurationProperties: [],
            propertyList: [],
            configurationPropertyMap: {},

            // TODO:  Should be fetched instead <script type="text/javascript" src="<scheme>://<domain>:<port>/integration/catalog_chooser/v1/sdk.js" />

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
                            self.propertyList.push({
                                key: key,
                                value: value,
                                description: null,
                                dataType: null,
                                type: 'alation'
                            });
                            self.configurationPropertyMap[key] = value;
                        })
                        if (successFn) {
                            successFn(response);
                        }
                    }
                    var _errorFn = function (err) {
                        if (errorFn) {
                            errorFn(err)
                        }
                    }

                    var promise = $http.get('/proxy/v1/configuration/properties');
                    promise.then(_successFn, _errorFn);
                    return promise;
                }
            }
        };

        data.init();
        return data;
    }]);
});