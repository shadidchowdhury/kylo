define(['angular',
        'services/module-name',
        'jquery',
        'services/AccessControlService',
        'services/StateService',
        'services/SearchService',
        'services/broadcast-service',
        'services/CommonRestUrlService',
        'services/PaginationDataService',
        'services/SideNavService',
        'services/TableOptionsService',
        'services/ConfigurationService',
        'services/AddButtonService',
        'services/FileUploadService',
        'services/WindowUnloadService',
        'services/Utils',
        'services/HttpService',
        'services/NotificationService',
        'services/AngularHttpInterceptor',
        'services/UserGroupService',
        'services/AngularModuleExtensionService',
        'services/BroadcastConstants'], function (angular,moduleName) {
   return angular.module(moduleName);
});
