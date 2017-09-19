/**
 * Used to store temporary state of the Alation object
 * when a user clicks the Edit link for the Feed Details so the object can be passed to the template factory
 *
 */
define(['angular','plugin/alation-module/module-name'], function (angular,moduleName) {
    angular.module(moduleName).service('AlationService', function () {

        var self = this;
        this.selectedData = {};

    });
});