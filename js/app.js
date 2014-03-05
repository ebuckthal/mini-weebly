angular.module('miniWeeblyApp', [])

.factory('Element', function() {
   return {
      type: 'element'
   }
})


.service('Drop', function() {
   this.type = '';
   this.active = false;
})

.service('Pages', function() {

      this.pages = [
         { title: "Page 1",  elements: [] }
      ];

      this.currentIndex = 0;
      this.currentPage = this.pages[this.currentIndex];
})

.controller('pageCtrl', function($scope, Pages) {

   $scope.pageService = Pages;

   $scope.addPage = function() {
      if($scope.title.length > 0) {
         $scope.pageService.pages.push({ title: $scope.title, elements: [] });
         $scope.title = '';
      }
   }

   $scope.deletePage = function(index) {
      if($scope.pageService.pages.length == 1) {
         return;
      }

      $scope.pageService.pages.splice(index, 1);

      $scope.selectPage(Math.max($scope.pageService.currentIndex-1,0));
   }

   $scope.selectPage = function(index) {
      $scope.pageService.currentIndex = index;
      $scope.pageService.currentPage = $scope.pageService.pages[$scope.pageService.currentIndex];
   };

})

.controller('templateCtrl', function($scope, Pages, Drop) {

   $scope.dropService = Drop;
   $scope.pageService = Pages;

   $scope.addElement = function() {

      console.log($scope.pageService);

      if($scope.dropService.active) {

         $scope.pageService.currentPage.elements.push({
            type: $scope.dropService.type,
            content: []
         });

         $scope.dropService.active = false;
      }
   }

   $scope.deleteElement = function(index) {
      $scope.pageService.currentPage.elements.splice(index, 1);
      //$scope.pageService.pages[$scope.pageService.currentPage].elements.splice(index, 1);
   }

})

.directive('dropme', function() {

   return {
      restrict: "A",
      link: function(scope, element, attrs) {

         element.on('mousemove', function(event) {
            console.log(event.pageY-82-90);
            console.log(event.pageX-308);

         });

         element.on('mouseup', function(event) {
            scope.$apply(attrs.drop);
         });
      }
   }

})

.directive('dragme', function($document, Drop) {

   return {
      restrict: "A",
      scope: {
         type: '@'
      },
      link: function(scope, element, attrs) {

         scope.servDrop = Drop;

         var startX = 0, startY = 0, x = 0, y = 0;

        element.on('mousedown', function(event) {

           Drop.type = attrs.type;
           Drop.active = true;

          // Prevent default dragging of selected content
          event.preventDefault();

          element.css({
            'pointer-events': 'none',
            'box-shadow': '5px 5px 20px rgba(0,0,0,0.3)' 
          })

          startX = event.screenX;
          startY = event.screenY;
          $document.on('mousemove', mousemove);
          $document.on('mouseup', mouseup);
        });
 
        function mousemove(event) {
          y = event.screenY - startY;
          x = event.screenX - startX;

          element.css({
            top: y + 'px',
            left:  x + 'px',
            'z-index': '100'
          });

        }

        function mouseup() {
            element.css({
               top: '',
               left: '',
               'z-index': '',
               'box-shadow': '',
               'pointer-events': 'auto'
            });

            $document.unbind('mousemove', mousemove);
            $document.unbind('mouseup', mouseup);
         }
      }
   }
})
