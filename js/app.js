angular.module('miniWeeblyApp', [])

.service('Drop', function() {
   this.type = '';
   this.active = false;
   this.id;
})

.service('Pages', function() {
   this.pages = [
      { title: "Page 1",  elements: [] }
   ];

   this.elementIndex = 1;
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

.controller('templateCtrl', function($scope, Pages) {

   $scope.pageService = Pages;

   $scope.addElement = function(type, x, y) {

      var minheight, minwidth, height, width;

      if (type == 'title') {
         minwidth = 300;
         minheight = 200;

      } else if (type == 'nav') {
         minwidth = 200;
         minheight = 300;
         
      } else if (type == 'image') {
         minwidth = 300;
         minheight = 300;

      } else if (type == 'text') {
         minwidth = 300;
         minheight = 300;
      }

      height = 400;
      width = 400;

      var element = {
         id: $scope.pageService.elementIndex++,
         type: type,
         preferred: { top: y, left: x },
         current: { top: y, left: x },
         size: { height: height, width: width, minheight: minheight, minwidth: minwidth },
         content: ''
      };

      $scope.pageService.currentPage.elements.push(element);

      return element;
   }

   $scope.deleteElement = function(id) {

      for(var i = 0, element; element = $scope.pageService.currentPage.elements[i++];) {

         if(element.id == id) {
            $scope.pageService.currentPage.elements.splice(i-1, 1);
            break;
         }
      }

      $scope.settleElements();
   }

   $scope.settleElements = function() {

      if($scope.pageService.currentPage.elements.length <= 0) {
         return; 
      }

      var widthTemplate = document.querySelector('.group-drop').offsetWidth;

      var elementsToPlace = $scope.pageService.currentPage.elements.slice(0);

      var thisRowStartsAt; 

      while(elementsToPlace.length > 0) {

         elementsToPlace = _.sortBy(elementsToPlace, function(element) {
            return element.preferred.top;
         });

         var firstElement = elementsToPlace[0];

         if(thisRowStartsAt == undefined) {
            thisRowStartsAt = firstElement.preferred.top;
         }

         var group = [];

         group.push(firstElement);

         //get a group of elements that are within this elements height
         for(var i = 1; i < elementsToPlace.length; i++) {
            var element = elementsToPlace[i];

            if(element.preferred.top < thisRowStartsAt + firstElement.size.height) {
               group.push(element)
            } else {
               break;
            }

         }
         elementsToPlace.splice(0, group.length);

         //sort this group by leftness
         group = _.sortBy(group, function(element) {
            return element.preferred.left;
         })

         var rightBound = 0;
         var nextRowStartsAt = thisRowStartsAt;

         //place element in best spot, push it's leftness if necessary
         for(var i = 0, element; element = group[i++];) {

            element.current.left = Math.max(element.preferred.left, rightBound);

            rightBound = element.current.left + element.size.width;

            if(rightBound > widthTemplate) {
               elementsToPlace.push(element);

            } else {
               element.current.top = Math.max(element.preferred.top, thisRowStartsAt);

               nextRowStartsAt = Math.max(element.current.top + element.size.height, nextRowStartsAt);
            }
         }

         thisRowStartsAt = nextRowStartsAt;
      }
   }

})

//handles elements moving themselves and making their locations fit 
.controller('elementCtrl', function($scope, $document, Drop, Pages) {

   $scope.servDrop = Drop;
   $scope.servPages = Pages;

   $scope.startResize = function(direction, id) {

      event.stopPropagation();

      $scope.width = document.querySelector('.group-drop').offsetWidth;

      $scope.origin = { 
         x: event.x, 
         y: event.y, 
         width: $scope.element.size.width, 
         height: $scope.element.size.height,
         top: $scope.element.current.top,
         left: $scope.element.current.left
      };

      $scope.dragging = direction;


      $scope.servDrop.active = true;
      $scope.servDrop.id = id;

      $document.on('mousemove', $scope.resize);
      $document.on('mouseup', $scope.endResize);

   }

   $scope.resize = function() {

      var deltax = event.x - $scope.origin.x;
      var deltay = event.y - $scope.origin.y;

      if($scope.dragging == 'bottom') {

         $scope.element.size.height = Math.max($scope.origin.height + deltay, $scope.element.size.minheight);

      } else if($scope.dragging == 'left') {

         $scope.element.size.width = Math.max($scope.origin.width - deltax, $scope.element.size.minwidth);
         $scope.element.preferred.left = Math.max(0, $scope.origin.left + deltax);

      } else if($scope.dragging == 'right') {

         $scope.element.size.width = Math.max($scope.origin.width + deltax, $scope.element.size.minwidth);

      } else if($scope.dragging == 'move') {

         $scope.element.preferred.left = Math.min($scope.width - $scope.element.size.width, Math.max(0, $scope.origin.left + deltax));
         $scope.element.preferred.top = Math.max(0, $scope.origin.top + deltay);
      }

      $scope.settleElements();
      $scope.$apply();
   }

   $scope.endResize = function() {

      $scope.dragging = null;

      $scope.servDrop.active = false;

      $document.unbind('mousemove');
      $document.unbind('mouseup');

   }

})

.directive('droppable', function(Drop, $document) {

   return {
      restrict: "A",
      link: function(scope, element, attrs) {

         scope.servDrop = Drop;

         scope.resizeElement;

         function getOffset(element) {

            var retTop = 0;
            var retLeft = 0;

            while(element) {
               retTop += element.offsetTop;
               retLeft += element.offsetLeft;

               element = element.offsetParent;
            }

            return { top: retTop, left: retLeft };

         }

         element.on('mouseleave', function(event) {
            if(!scope.servDrop.dragging || !scope.servDrop.id) {
               return;
            }

            scope.resizeElement.scope().deleteElement(scope.servDrop.id);

            scope.$apply();

            scope.servDrop.id = null;

         });

         element.on('mouseenter', function(event) {


            if(!scope.servDrop.active || !scope.servDrop.dragging) {
               return;
            }

            var offset = getOffset(document.querySelector('.group-drop'));

            var element = scope.addElement(scope.servDrop.type, 
                  event.pageX-offset.left, 
                  event.pageY-offset.top-82);

            scope.$apply();

            scope.servDrop.id = element.id;

            scope.resizeElement = angular.element(document.querySelector('[data-id="' + element.id + '"]'));

            scope.resizeElement.scope().startResize('move', element.id);
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

           scope.servDrop.type = attrs.type;
           scope.servDrop.active = true;
           scope.servDrop.dragging = true;

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
           scope.servDrop.active = false;
           scope.servDrop.dragging = false;

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
