angular.module('miniWeeblyApp', [])

.factory('Element', function() {
   return {
      type: 'element'
   }
})

.service('Pages', function() {
      this.currentPage = 0;
      
      this.pages = [
         { title: "Page 1",  elements: [] }
      ];
})

.controller('pageCtrl', function($scope, Pages) {

   $scope.pageService = Pages;

   $scope.addNewPage = function(title) {
      if(title.length > 0) {
         $scope.pageService.pages.push({ title: title, elements: [] });
      }
   }

   $scope.deletePage = function(index) {
      if($scope.pageService.pages.length == 1) {
         return;
      }

      $scope.pageService.currentPage--;

      $scope.pageService.pages.splice(index, 1);
   }

})

.controller('templateCtrl', function($scope, Pages) {

   $scope.pageService = Pages;

   $scope.handleDrop = function(type) {
      console.log('dropped type: ' + type);
   } 

   $scope.renderTemplate = function(index) {

   }
})

.directive('dropme', function() {

   return {
      restrict: "A",
      link: function(scope, element) {

         element.on('mouseover', function(event) {
            console.log('over');
         });

      }
   }

})

.directive('dragme', function($document) {

   return {
      restrict: "A",
      scope: {
         type: '@'
      },
      link: function(scope, element) {
         var startX = 0, startY = 0, x = 0, y = 0;

         element.css({
            position: 'relative',
            border: '1px solid red',
            backgroundColor: 'lightgrey',
            cursor: 'pointer',
         });

        element.on('mousedown', function(event) {
          // Prevent default dragging of selected content
          event.preventDefault();

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
               'z-index': ''
            });

            $document.unbind('mousemove', mousemove);
            $document.unbind('mouseup', mouseup);
         }
      }
   }
})

.directive('draggable', function() {

   return {
      restrict: "A",
      link: function(scope, element) {

        var el = element[0];
        //scope.drag = false;

        el.draggable = true;

        el.addEventListener(
            'dragstart',
            function(e) {
               console.log('dragged type: ' + this.type);
               e.dataTransfer.effectAllowed = 'move';
               e.dataTransfer.setData('type', this.type);
               this.classList.add('drag');
               return false;
            },
            false
        );

        el.addEventListener(
            'dragend',
            function(e) {
                this.classList.remove('drag');
                return false;
            },
            false
        );

      }
   }
   
})

.directive('droppable', function() {

   return {
      restrict: "A",
      scope: {
         drop: '&' // parent
      },
      link: function(scope, element) {

         var el = element[0];
         el.addEventListener('dragover',
            function(e) {
               e.dataTransfer.dropEffect = 'move';
               // allows us to drop
               if (e.preventDefault) e.preventDefault();
               this.classList.add('over');
               return false;
            },
            false
         );

         el.addEventListener('dragenter',
            function(e) {
               this.classList.add('over');
               return false;
            },
            false
         );

         el.addEventListener('dragleave',
            function(e) {
               this.classList.remove('over');
               return false;
            },
            false
         );

         //console.log(scope);

         el.addEventListener('drop',
            function(e) {
               //Stops some browsers from redirecting.
               
               if (e.stopPropagation) e.stopPropagation();
               this.classList.remove('over');

               var item = e.dataTransfer.getData('type');

               scope.$apply(function(scope) {
                  var fn = scope.drop();

                  if ('undefined' !== typeof fn) {            
                     //fn(e.dataTransfer.getData('type'));
                     fn(item);
                  }
               });
                         
               return false;
            },
            false
         );
      }
   }
});
