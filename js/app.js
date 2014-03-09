angular.module('miniWeeblyApp', [])

.service('Drop', function() {
   this.type = '';
   this.active = false;
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

      $scope.pageService.currentPage.groups.splice(index, 0, {
         elements: []
      });
   };

   $scope.addElementToGroup = function(group, type, index) {

      var grp = $scope.pageService.currentPage.groups[group];
      
      if(grp.elements.length > 1) {
         return;
      }

      if (type == 'title') {
         var minheight = 50;
         var height = 100;
      } else {
         var minheight = 150;
         var height = 200;
      }

      var element = {
         type: type,
         size: { height: height, width: 200, minheight: minheight},
         content: ''
      };

      grp.elements.splice(index, 0, element);
   }

   $scope.deleteGroup = function(index) {
      $scope.pageService.currentPage.groups.splice(index, 1);
   }

   $scope.deleteElement = function(group, index) {

      var grp = $scope.pageService.currentPage.groups[group];
      grp.elements.splice(index, 1);

      if(grp.elements.length == 0) {
         $scope.deleteGroup(group);
      }
   }

})

.directive('resizable', function($document) {

   return {
      restrict: "A",
      link: function(scope, element, attrs) {

         element.on('mousedown', function(event) {
            scope.dragging = scope.whichBorder(event);

            scope.origin = { 
               x: event.x, 
               y: event.y, 
               width: scope.element.size.width, 
               height: scope.element.size.height 
            };

            $document.on('mousemove', mousemove);
            $document.on('mouseup', mouseup);
         });
 
         function mousemove(event) {

            event.preventDefault();

            if(scope.dragging == null) {
               return;
            }

            if(scope.dragging == 'bottom') {
               var delta = event.y - scope.origin.y; 
               scope.element.size.height = scope.origin.height + delta;
               scope.element.size.height = Math.max(scope.element.size.height, scope.element.size.minheight);
            }


            //scope.origin = { x: event.x, y: event.y };
        }

        function mouseup() {

            scope.dragging = null;

            $document.unbind('mousemove', mousemove);
            $document.unbind('mouseup', mouseup);
         }

         scope.whichBorder = function(event) {
            var y = event.y;
            var x = event.x;
            var rect = element[0].getBoundingClientRect();

            
            if (y < rect.top + 10) {
               return 'top';
            } else if (y > rect.bottom - 10) {
               return 'bottom';
            } else if (x < rect.left + 10) {
               return 'left';
            } else if (x > rect.right - 10) {
               return 'right';
            } else {
               return null;
            }
         };

      }
   }

})

.directive('droppable', function(Drop) {

   return {
      restrict: "A",
      link: function(scope, element, attrs) {

         scope.servDrop = Drop;

         scope.hoverGroupIndex = -1;
         scope.hoverElementIndex = -1;

         scope.isInThisGroup = function(index) {
            return (scope.hoverElementIndex < 0 && scope.hoverGroupIndex == index);
         }

         scope.isLastGroup = function() {
            return (scope.pageService.currentPage.groups.length == scope.hoverGroupIndex);

         }

         scope.isInThisElement = function(group, element) {
            return (scope.hoverGroupIndex == group 
                  && scope.hoverElementIndex == element 
                  && scope.pageService.currentPage.groups[group].elements.length < 2);
         }

         scope.getDropLocationFromElement = function(el, event) {

            var y = event.y;
            var x = event.x;
            var rect = el.getBoundingClientRect();

            if(y < rect.top + (rect.height * .2)) {
               return 'top';
               
            } else if(y > rect.bottom - (rect.height * .2)) {
               return 'bottom';

            } else if (x < rect.left + (rect.width * .5)) {
               return 'left';

            } else {
               return 'right';
            }
         }

         scope.setDropLocation = function(event) {

            var grps = angular.element(element.children()[1]).children();

            var added = false;

            for(var i = 0; i < grps.length && !added; i++) {
               
               var loc = scope.getDropLocationFromElement(grps[i], event);
               console.log(loc);

               if (loc == 'left') {

                  scope.hoverGroupIndex = i;
                  scope.hoverElementIndex = 0;

                  added = true;

               } else if (loc == 'right') {

                  scope.hoverGroupIndex = i;
                  scope.hoverElementIndex = 1;

                  added = true;

               } else if (loc == 'top') {

                  scope.hoverGroupIndex = i;
                  scope.hoverElementIndex = -1;

                  added = true;
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

               scope.addGroup(scope.hoverGroupIndex);
               scope.addElementToGroup(scope.hoverGroupIndex, scope.servDrop.type, 0);
            }

            scope.hoverGroupIndex = -1;
            scope.hoverElementIndex = -1;

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
          event.preventDefault();

           Drop.type = attrs.type;
           Drop.active = true;

          element.css({
            'pointer-events': 'none',
            'box-shadow': '5px 5px 20px rgba(0,0,0,0.3)' 
          })

          startX = event.x;
          startY = event.y;

          $document.on('mousemove', mousemove);
          $document.on('mouseup', mouseup);
        });
 
        function mousemove(event) {
          y = event.y - startY;
          x = event.x - startX;

          element.css({
            top: y + 'px',
            left:  x + 'px',
            'z-index': '100'
          });

        }

        function mouseup() {
           Drop.active = false;

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
