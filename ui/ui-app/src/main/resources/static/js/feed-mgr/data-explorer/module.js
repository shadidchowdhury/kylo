define(['angular', 'feed-mgr/data-explorer/module-name','kylo-utils/LazyLoadUtil','constants/AccessConstants','kylo-common', 'services/AlationDataExplorerService','kylo-services','kylo-feedmgr','jquery'], function (angular,moduleName,lazyLoadUtil,AccessConstants) {
    var module = angular.module(moduleName, []);

    /**
     * LAZY loaded in from /app.js
     */
    module.config(['$stateProvider',function ($stateProvider) {
        $stateProvider.state(AccessConstants.UI_STATES.DATA_EXPLORER.state,{
            url:'/data-explorer',
            params: {
            },
            views: {
                'content': {
                    templateUrl: 'js/feed-mgr/data-explorer/data-explorer-view.html'
                }
            },
            resolve: {
                loadMyCtrl: lazyLoadController(['feed-mgr/data-explorer/dataExplorerController'])
            },
            data:{
                breadcrumbRoot:true,
                displayName:'Data Explorer',
                module:moduleName,
                permissions:AccessConstants.UI_STATES.DATA_EXPLORER.permissions
            }
        });

        function lazyLoadController(path){
            return lazyLoadUtil.lazyLoadController(path,'feed-mgr/data-explorer/module-require');
        }

    }]);

    return module;
});



