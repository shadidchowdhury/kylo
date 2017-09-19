define(['angular', 'plugin/alation-module/module-name'], function (angular, moduleName) {

    var controller = function($transition$,$http,$interval,$timeout, StateService, AlationService){
        var self = this;

         this.jdbcUriParam = $transition$.params().dbURL;
         this.tableNameParam = $transition$.params().tableName;

        this.name = 'Data discovery with Alation';

        /**
         * An array of foods for a sample selection
         * @type {Array}
         */
        this.foods = [];

        /**
         * The selected food
         * @type {string}
         */
        this.selectedFood = '';

        /**
         * A list of icons to cycle through
         * @type {[*]}
         */
        this.icons = ['free_breakfast','cake','local_dining','bug_report','mood','mood_bad','sentiment_satisfied','sentiment_neutral', 'sentiment_dissatisfied','fitness_center'];
        /**
         * a list of colors
         * @type {[*]}
         */
        this.colors= ['red','blue','green','grey','black'];
        /**
         * the selected icon
         * @type {*}
         */
        this.icon = this.icons[0];
        /**
         * the selected color
         * @type {*}
         */
        this.color = this.colors[0];

        AlationService.selectedData = {dataSourceURI: this.jdbcUriParam, fullTableName: this.tableNameParam};

        //fetchFood();
        navigateToDefineFeed();

        function navigateToDefineFeed(){
            StateService.FeedManager().Feed().navigateToDefineFeed();
        }

        function fetchFood(){
            $http.get("/proxy/v1/example/module/food").then(function(response){
                if(response.data){
                    self.foods = response.data;
                }
            })
        }
    };



    angular.module(moduleName).controller('ExampleModuleController',['$transition$','$http','$interval','$timeout', 'StateService', 'AlationService', controller]);

});
