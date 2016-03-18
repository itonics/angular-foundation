angular.module('mm.foundation.accordion', [])

.constant('accordionConfig', {
  closeOthers: true
})

.controller('AccordionController', ['$scope', '$attrs', 'accordionConfig', function ($scope, $attrs, accordionConfig) {

  // This array keeps track of the accordion groups
  this.groups = [];

  // Ensure that all the groups in this accordion are closed, unless close-others explicitly says not to
  this.closeOthers = function(openGroup) {
    var closeOthers = angular.isDefined($attrs.closeOthers) ? $scope.$eval($attrs.closeOthers) : accordionConfig.closeOthers;
    if ( closeOthers ) {
      angular.forEach(this.groups, function (group) {
        if ( group !== openGroup ) {
          group.isOpen = false;
        }
      });
    }
  };
  
  // This is called from the accordion-group directive to add itself to the accordion
  this.addGroup = function(groupScope) {
    var that = this;
    this.groups.push(groupScope);

    groupScope.$on('$destroy', function (event) {
      that.removeGroup(groupScope);
    });
  };

  // This is called from the accordion-group directive when to remove itself
  this.removeGroup = function(group) {
    var index = this.groups.indexOf(group);
    if ( index !== -1 ) {
      this.groups.splice(index, 1);
    }
  };

}])

// The accordion directive simply sets up the directive controller
// and adds an accordion CSS class to itself element.
.directive('accordion', function () {
  return {
    restrict:'EA',
    controller:'AccordionController',
    transclude: true,
    replace: false,
    templateUrl: 'template/accordion/accordion.html'
  };
})

// The accordion-group directive indicates a block of html that will expand and collapse in an accordion
.directive('accordionGroup', ['$parse', function($parse) {
  return {
    require:'^accordion',         // We need this directive to be inside an accordion
    restrict:'EA',
    transclude:true,              // It transcludes the contents of the directive into the template
    replace: true,                // The element containing the directive will be replaced with the template
    templateUrl:'template/accordion/accordion-group.html',
    scope:{ heading:'@' },        // Create an isolated scope and interpolate the heading attribute onto this scope
    controller: function() {
      this.setHeading = function(element) {
        this.heading = element;
      };
    },
    link: function(scope, element, attrs, accordionCtrl) {
      // Customized for LEB :: The jQuery toggleSlide animation // Replaced the default inline css display block/none
      var accordContent = element.find('.content');
      var accordOuterContent = element.find('.outer-content');
      var accordAnchor = element.find('a:first');
      var accordContH = accordContent.outerHeight();
      var accordSlideAnimEasing = "easeInOutCubic";
      var accordSlideAnimDuration = 600;

      accordAnchor.click(function(){
        if(accordAnchor.hasClass('active')){
          accordContH = accordContent.outerHeight();
          accordSlideAnimDuration = (accordContH > 300)? 650 : accordSlideAnimDuration;
          accordSlideAnimDuration = (accordContH > 500)? 700 : accordSlideAnimDuration;
          accordSlideAnimDuration = (accordContH > 700)? 800 : accordSlideAnimDuration;
          accordSlideAnimDuration = (accordContH > 1000)? 1000 : accordSlideAnimDuration;
          accordSlideAnimDuration = (accordContH > 1500)? 1400 : accordSlideAnimDuration;

          accordOuterContent.css('overflow','hidden');
          accordContent.stop(true, false).animate({'margin-top':-accordContH}, accordSlideAnimDuration, accordSlideAnimEasing, function(){
            accordOuterContent.hide();
            accordOuterContent.css('overflow','');
          });
        }else{
          accordOuterContent.show();
          accordContent.css({'margin-top':-accordContent.outerHeight()});
          accordOuterContent.css('overflow','hidden');
          accordContent.stop(true, false).animate({'margin-top':0}, accordSlideAnimDuration, accordSlideAnimEasing, function(){
            accordOuterContent.css('overflow','');
          });
        }
        /*accordContent.slideToggle(function(){
            jQuery(this).css('overflow','');
        });*/
      });
      var getIsOpen, setIsOpen;

      accordionCtrl.addGroup(scope);

      scope.isOpen = false;
      
      if ( attrs.isOpen ) {
        getIsOpen = $parse(attrs.isOpen);
        setIsOpen = getIsOpen.assign;
        // Customized:: The closing(initial) needs to be done manually, since we are using jQuery toggleSlide animation
        if(!getIsOpen()){
          accordOuterContent.hide();
        }else{
          accordOuterContent.show();
        }

        scope.$parent.$watch(getIsOpen, function(value) {
          scope.isOpen = !!value;
        });
      }

      scope.$watch('isOpen', function(value) {
        if ( value ) {
          accordionCtrl.closeOthers(scope);
        }
        if ( setIsOpen ) {
          setIsOpen(scope.$parent, value);
        }
      });
    }
  };
}])

// Use accordion-heading below an accordion-group to provide a heading containing HTML
// <accordion-group>
//   <accordion-heading>Heading containing HTML - <img src="..."></accordion-heading>
// </accordion-group>
.directive('accordionHeading', function() {
  return {
    restrict: 'EA',
    transclude: true,   // Grab the contents to be used as the heading
    template: '',       // In effect remove this element!
    replace: true,
    require: '^accordionGroup',
    compile: function(element, attr, transclude) {
      return function link(scope, element, attr, accordionGroupCtrl) {
        // Pass the heading to the accordion-group controller
        // so that it can be transcluded into the right place in the template
        // [The second parameter to transclude causes the elements to be cloned so that they work in ng-repeat]
        accordionGroupCtrl.setHeading(transclude(scope, function() {}));
      };
    }
  };
})

// Use in the accordion-group template to indicate where you want the heading to be transcluded
// You must provide the property on the accordion-group controller that will hold the transcluded element
// <div class="accordion-group">
//   <div class="accordion-heading" ><a ... accordion-transclude="heading">...</a></div>
//   ...
// </div>
.directive('accordionTransclude', function() {
  return {
    require: '^accordionGroup',
    link: function(scope, element, attr, controller) {
      scope.$watch(function() { return controller[attr.accordionTransclude]; }, function(heading) {
        if ( heading ) {
          element.html('');
          element.append(heading);
        }
      });
    }
  };
});
