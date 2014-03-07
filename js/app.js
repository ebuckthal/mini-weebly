angular.module('miniWeeblyApp', [])

.service('Drop', function() {
   this.type = '';
   this.active = false;
   this.index = 0;
})

.service('Pages', function() {

      this.pages = [
         { title: "Page 1",  groups: [] }
      ];

      this.currentIndex = 0;
      this.currentPage = this.pages[this.currentIndex];
})

.controller('pageCtrl', function($scope, Pages) {

   $scope.pageService = Pages;

   $scope.addPage = function() {
      if($scope.title.length > 0) {
         $scope.pageService.pages.push({ title: $scope.title, groups: [] });
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

.controller('templateCtrl', function($scope, Pages) {

   $scope.pageService = Pages;

   $scope.addGroup = function(index, type) {
      console.log('addGroup: ' + index + ' ' + type);
      var element = {
         type: type,
         content: []
      };

      $scope.pageService.currentPage.groups.splice(index, 0, {
         elements: [element]
      });

      console.log($scope.pageService.currentPage);

   };

   $scope.addElementToGroup = function(group, type, index) {
      console.log('add element to Group: ' + group + ' ' + type);

      var grp = $scope.pageService.currentPage.groups[group];
      
      if(grp.elements.length > 1) {
         return;
      }

      console.log(grp.elements.length);

      var element = {
         type: type,
         content: []
      };

      grp.elements.splice(index, 0, element);
   }

   $scope.deleteGroup = function(index) {
      $scope.pageService.currentPage.groups.splice(index, 1);
      //$scope.pageService.pages[$scope.pageService.currentPage].elements.splice(index, 1);
   }

   $scope.deleteElement = function(group, index) {

      var grp = $scope.pageService.currentPage.groups[group];
      grp.elements.splice(index, 1);

      if(grp.elements.length == 0) {
         $scope.deleteGroup(group);
      }
   }

})

.directive('droppableArea', function(Drop) {

   return {
      restrict: "A",
      link: function(scope, element, attrs) {

         scope.servDrop = Drop;

         scope.hoverGroupIndex = -1;
         scope.hoverElementIndex = -1;

         scope.getDropLocationFromElement = function(el, event) {

            var y = event.y;
            var x = event.x;
            var rect = el.getBoundingClientRect();

            var height = rect.bottom - rect.top;
            var width = rect.right - rect.left;
            
            
            if(y < rect.top + (height * .2)) {
               return 'top';
               
            } else if(y > rect.bottom - (height * .2)) {
               return 'bottom';

            } else if (x < rect.left + (width * .5)) {
               return 'left';

            } else {
               return 'right';
            }
         }

         scope.setDropLocation = function(event) {

            var grps = angular.element(element.children()[1]).children();

            var added = false;

            for(var i = 0; i < grps.length; i++) {
               
               var loc = scope.getDropLocationFromElement(grps[i], event);

               if (loc == 'left') {

                  scope.hoverGroupIndex = i;
                  scope.hoverElementIndex = 0;

                  added = true;
                  break;

               } else if (loc == 'right') {

                  scope.hoverGroupIndex = i;
                  scope.hoverElementIndex = 1;

                  added = true;
                  break;

               } else if (loc == 'top') {

                  scope.hoverGroupIndex = i;
                  scope.hoverElementIndex = -1;

                  added = true;
                  break;
               }
            }

            if(!added) { //must go at last element
               scope.hoverGroupIndex = i;
               scope.hoverElementIndex = -1;
            }

         };


         element.on('mousemove', function(event) {

            if(!scope.servDrop.active) {
               scope.hoverGroupIndex = -1;
               scope.hoverElementIndex = -1;

               scope.$apply();
               return;
            }

            scope.setDropLocation(event);

            scope.$apply();

         });

         element.on('mouseup', function(event) {

            if(!scope.servDrop.active) {
               return;
            }

            if(scope.hoverElementIndex > -1) { //add to existing group

               scope.addElementToGroup(scope.hoverGroupIndex, scope.servDrop.type, scope.hoverElementIndex);

            } else { //make a new group

               scope.addGroup(scope.hoverGroupIndex, scope.servDrop.type);
            }

            scope.hoverGroupIndex = -1;
            scope.hoverElementIndex = -1;
            scope.servDrop.active = false;

            scope.$apply();
         });
      }
   }

})

.directive('draggable', function($document, Drop) {

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
