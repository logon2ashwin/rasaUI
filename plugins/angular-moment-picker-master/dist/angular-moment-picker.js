'use strict';

angular.module('momentPicker', []);
angular.module("momentPicker").run(["$templateCache", function($templateCache) {$templateCache.put("momentPicker.html","<div ng-switch=\"view\" class=\"moment-picker\">\n    <div ng-switch-when=\"year\">\n        <table>\n            <thead>\n            <tr>\n                <th ng-click=\"prev(10)\">&lsaquo;</th>\n                <th colspan=\"5\" class=\"switch\">\n                    {{years[0]|moment:\'YYYY\'}} - {{years[years.length-1]|moment:\'YYYY\'}}\n                </th>\n                <th ng-click=\"next(10)\">&rsaquo;</th>\n            </tr>\n            </thead>\n            <tbody>\n            <tr>\n                <td colspan=\"7\">\n          <span ng-class=\"{\'active\':isSameYear(year),\'now\':isNow(year), \'after\':isAfter(year),\'before\':isBefore(year)}\"\n                ng-repeat=\"year in years\"\n                ng-click=\"setDate(year)\">{{year|moment:\'YYYY\'}}</span>\n                </td>\n            </tr>\n            </tbody>\n        </table>\n    </div>\n    <div ng-switch-when=\"month\">\n        <table>\n            <thead>\n            <tr>\n                <th ng-click=\"prev()\">&lsaquo;</th>\n                <th colspan=\"5\" class=\"switch\" ng-click=\"setView(\'year\')\">{{moment|moment:\'MMMM YYYY\'}}</th>\n                <th ng-click=\"next()\">&rsaquo;</th>\n            </tr>\n            </thead>\n            <tbody>\n            <tr>\n                <td colspan=\"7\">\n          <span ng-repeat=\"month in months\"\n                ng-class=\"{\'active\':isSameMonth(month),\'after\':isAfter(month),\'before\':isBefore(month),\'now\':isNow(month)}\"\n                ng-click=\"setDate(month)\"\n                  >{{month|moment:\'MMM\'}}\n          </span>\n                </td>\n            </tr>\n            </tbody>\n        </table>\n    </div>\n    <div ng-switch-when=\"date\">\n        <table>\n            <thead>\n            <tr>\n                <th ng-click=\"prev()\">&lsaquo;</th>\n                <th colspan=\"5\" class=\"switch\" ng-click=\"setView(\'month\')\">{{moment|moment:\'MMMM YYYY\'}}</th>\n                <th ng-click=\"next()\">&rsaquo;</th>\n            </tr>\n            <tr>\n                <th ng-repeat=\"day in weekdays\" style=\"overflow: hidden\">{{day|moment:\'ddd\'}}</th>\n            </tr>\n            </thead>\n            <tbody>\n            <tr ng-repeat=\"week in weeks\">\n                <td ng-repeat=\"day in week\">\n          <span\n                  ng-class=\"{\'now\':isNow(day),\'active\':isSameDay(day),\'disabled\':(day.month()!=moment.month()),\'after\':isAfter(day),\'before\':isBefore(day)}\"\n                  ng-click=\"setDate(day)\">{{day|moment:\'DD\'}}</span>\n                </td>\n            </tr>\n            </tbody>\n        </table>\n    </div>\n    <div ng-switch-when=\"hours\">\n        <table>\n            <thead>\n            <tr>\n                <th ng-click=\"prev()\">&lsaquo;</th>\n                <th colspan=\"5\" class=\"switch\" ng-click=\"setView(\'date\')\" ng-bind=\"moment|moment:\'DD MMMM YYYY\'\"></th>\n                <th ng-click=\"next()\">&rsaquo;</th>\n            </tr>\n            </thead>\n            <tbody>\n            <tr>\n                <td colspan=\"7\">\n          <span ng-repeat=\"hour in hours\"\n                ng-class=\"{\'now\':isNow(hour),\'active\':isSameHour(hour), \'after\':isAfter(hour),\'before\':isBefore(hour)}\"\n                ng-click=\"setDate(hour)\">\n            {{hour|moment:\'HH:mm\'}}\n          </span>\n                </td>\n            </tr>\n            </tbody>\n        </table>\n    </div>\n    <div ng-switch-when=\"minutes\">\n        <table>\n            <thead>\n            <tr>\n                <th ng-click=\"prev()\">&lsaquo;</th>\n                <th colspan=\"5\" class=\"switch\" ng-click=\"setView(\'hours\')\" ng-bind=\"moment|moment:\'HH:mm - DD MMM YYYY\'\"></th>\n                <th ng-click=\"next()\">&rsaquo;</th>\n            </tr>\n            </thead>\n            <tbody>\n            <tr>\n                <td colspan=\"7\">\n          <span ng-repeat=\"minute in minutes\"\n                ng-class=\"{active:isSameMinutes(minute),\'now\':isNow(minute), \'after\':isAfter(minute),\'before\':isBefore(minute)}\"\n                ng-click=\"setDate(minute)\"\n                ng-bind=\"minute|moment:\'HH:mm\'\"></span>\n                </td>\n            </tr>\n            </tbody>\n        </table>\n    </div>\n</div>\n");}]);
'use strict';

angular.module('momentPicker').constant('moment', moment);

angular.module('momentPicker').factory('momentUtils', ['moment', function (moment) {

  return {
    createMoment: function createMoment(options, local){
      if(local){
        return options ? moment(options) : moment();
      }
      else {
        return options ? moment.utc(options) : moment.utc();
      }
    },
    getVisibleMinutes: function (date, step, local) {
      date = this.createMoment(date, local);
      var year = date.year();
      var month = date.month();
      var day = date.date();
      var hour = date.hour();
      var minutes = [];
      var minute, pushedMoment;
      for (minute = 0; minute < 60; minute += step) {
        pushedMoment = this.createMoment({year: year, month: month, day: day, hour: hour, minute: minute}, local);
        minutes.push(pushedMoment);
      }
      return minutes;
    },
    getVisibleHours: function (date, local) {
      date = this.createMoment(date, local);
      var year = date.year();
      var month = date.month();
      var day = date.date();
      var hours = [];
      var hour, pushedMoment;
      for (hour = 0; hour < 24; hour ++) {
        pushedMoment = this.createMoment({year: year, month: month, date: day, hour: hour}, local);
        hours.push(pushedMoment);
      }
      return hours;
    },
    getVisibleWeeks: function (date, local) {
      date = this.createMoment(date, local);
      var startMonth = date.month();
      var startYear = date.year();
      // set date to start of the week
      date.date(1);

      if (date.day() <= 1) {
        // day is sunday or monday, let's get back to the previous week
        date.day(-5);
      } else {
        // day is not sunday, let's get back to the start of the week
        date.day(date.day() - (date.day() - 1));
      }
      //if (date.day() === 1) {
      //  // day is monday, let's get back to the previous week
      //  date.day(-5);
      //}

      var weeks = [];
      var week;
      while (weeks.length < 6) {
        if (date.isSame(startYear, 'year') && date.isAfter(startMonth, 'month')) {
          break;
        }
        week = this.getDaysOfWeek(date, local);
        weeks.push(week);
        date.add(7, 'days');
      }
      return weeks;
    },
    getDaysOfWeek: function (date, local) {
      date = this.createMoment(date, local);
      var year = date.year();
      var month = date.month();
      var day = date.date();
      var days = [];
      var pushedDate;
      for (var i = 0; i < 7; i++) {
        pushedDate = this.createMoment({year:year, month:month, date:day, hour:12}, local);
        pushedDate.weekday(i);
        pushedDate.hour(12);
        days.push(pushedDate);
        date.day(1);
      }
      return days;
    },
    getVisibleMonths: function (date, local) {
      date = this.createMoment(date, local);
      var year = date.year();
      var months = [];
      var pushedDate;
      for (var month = 0; month <= 11; month++) {
        pushedDate = this.createMoment({year:year, month:month, day:1, hour:12}, local);
        months.push(pushedDate);
      }
      return months;
    },
    getVisibleYears: function (date, local) {
      date = this.createMoment(date, local);
      var year = date.year();
      var years = [];
      var pushedMoment;
      for (var i = 0; i < 12; i++) {
        pushedMoment = this.createMoment({year: year, hour:12}, local);
        years.push(pushedMoment);
        year++;
      }
      return years;
    },

    isAfter: function (model, date, local) {
      if(this.isValidDate(model)){
        return model.isAfter(this.createMoment(date, local));
      }
      return false;
    },
    isBefore: function (model, date, local) {
      if(this.isValidDate(model)){
        return model.isBefore(this.createMoment(date, local));
      }
      return false;
    },
    isSameYear: function (model, date, local) {
      if(this.isValidDate(model)){
        return model.isSame(this.createMoment(date, local), 'year');
      }
      return false;
    },
    isSameMonth: function (model, date, local) {
      if(this.isValidDate(model)){
        return  model.isSame(this.createMoment(date, local), 'month');
      }
      return false;
    },
    isSameDay: function (model, date, local) {
      if(this.isValidDate(model)){
        return model.isSame(this.createMoment(date, local), 'day');
      }
      return false;
    },
    isSameHour: function (model, date, local) {
      if(this.isValidDate(model)){
        return  model.isSame(this.createMoment(date, local), 'hour');
      }
      return false;
    },
    isSameMinutes: function (model, date, local) {
      if(this.isValidDate(model)){
        return model.isSame(this.createMoment(date, local), 'minute');
      }
      return false;
    },
    isValidDate: function (value) {
      return moment.isMoment(value);
    }
  };
}]);

'use strict';

angular.module('momentPicker')
  .constant('momentPickerConfig', {
    template: 'momentPicker.html',
    view: 'month',
    views: ['year', 'month', 'date', 'hours', 'minutes'],
    step: 5,
    local: false
  })
  .filter('moment', ['moment', function (moment) {
    return function (input, format) {
      if (input) {
        if (moment.isMoment(input)) {
          return input.format(format);
        }
        else {
          return moment(input).format(format);
        }
      }
      else {
        return '';
      }
    }
  }])

  .filter('momentUTC', ['moment', function (moment) {
    return function (input, format) {
      if (input) {
        if (moment.isMoment(input)) {
          var m = moment(input).utc();
          return m.format(format);
        }
        else {
          return moment.utc(input).format(format);
        }
      }
      else {
        return '';
      }
    }
  }])
  .filter('momentLocal', ['moment', function (moment) {
    return function (input, format) {
      if (input) {
        if (moment.isMoment(input)) {
          var m = moment(input).local();
          return m.format(format);
        }
        else {
          return moment(input).local().format(format);
        }
      }
      else {
        return '';
      }
    }
  }])
  .directive('momentPicker', ['momentPickerConfig', 'momentUtils',
    function momentPickerDirective(momentPickerConfig, momentUtils) {

      //noinspection JSUnusedLocalSymbols
      return {
        // this is a bug ?
        require: '?ngModel',
        template: '<div ng-include="template"></div>',
        restrict: 'AE',
        scope: {
          model: '=momentPicker',
          after: '=?',
          before: '=?',
          minView: '@?',
          maxView: '@?',
          minMoment: '=?',
          maxMoment: '=?',
          local: '=?'
        },
        link: function (scope, element, attrs, ngModel) {
          scope.local = scope.local || momentPickerConfig.local;
          var arrowClick = false;
          scope.moment = newMoment(scope.model);
          scope.minView = scope.minView || 'year';
          scope.maxView = scope.maxView || 'date';
          scope.views = momentPickerConfig.views.concat();

          scope.view = attrs.view || momentPickerConfig.view;
          scope.now = newMoment();
          scope.template = attrs.template || momentPickerConfig.template;

          var step = parseInt(attrs.step || momentPickerConfig.step, 10);
          var partial = !!attrs.partial;

          //if ngModel, we can add min and max validators
          if (ngModel) {
            if (angular.isDefined(scope.minMoment)) {
              var minVal;
              ngModel.$validators.min = function (value) {
                return !momentUtils.isValidDate(value) || angular.isUndefined(minVal) || value.isSame(minVal) || value.isAfter(minVal);
              };
              scope.$watch('minMoment', function (val) {
                minVal = val;
                ngModel.$validate();
              });
            }

            if (angular.isDefined(scope.maxMoment)) {
              var maxVal;
              ngModel.$validators.max = function (value) {
                return !momentUtils.isValidDate(value) || angular.isUndefined(maxVal) || value.isSame(maxVal) || value.isBefore(maxVal);
              };
              scope.$watch('maxMoment', function (val) {
                maxVal = val;
                ngModel.$validate();
              });
            }
          }
          //end min, max date validator

          scope.views = scope.views.slice(
            scope.views.indexOf(scope.maxView || 'year'),
            scope.views.indexOf(scope.minView || 'minutes') + 1
          );

          if (scope.views.length === 1 || scope.views.indexOf(scope.view) === -1) {
            scope.view = scope.views[0];
          }

          scope.setView = function (nextView) {
            if (scope.views.indexOf(nextView) !== -1) {
              scope.view = nextView;
            }
          };

          scope.setDate = function (date) {
            if (attrs.disabled) {
              return;
            }
            scope.moment = date;
            // change next view
            var nextView = scope.views[scope.views.indexOf(scope.view) + 1];
            if ((!nextView || partial) || scope.model) {

              scope.model = scope.moment;
              //scope.model = new Date(scope.model || date);
              //if ngModel , setViewValue and trigger ng-change, etc...
              if (ngModel) {
                ngModel.$setViewValue(scope.moment);
              }

              var view = partial ? 'minutes' : scope.view;
              //noinspection FallThroughInSwitchStatementJS
              switch (view) {
                case 'minutes':
                  scope.model.minute(scope.moment.minute());
                /*falls through*/
                case 'hours':
                  scope.model.hour(scope.moment.hour());
                /*falls through*/
                case 'date':
                  scope.model.day(scope.moment.day());
                /*falls through*/
                case 'month':
                  scope.model.month(scope.moment.month());
                /*falls through*/
                case 'year':
                  scope.model.year(scope.moment.year());
              }
              scope.$emit('setDate', scope.model, scope.view);
            }

            if (nextView) {
              scope.setView(nextView);
            }

            if (!nextView && attrs.autoClose === 'true') {
              element.addClass('hidden');
              scope.$emit('hidePicker');
            }
          };

          function update() {
            var view = scope.view;

            if (scope.model && !arrowClick) {
              scope.moment = newMoment(scope.model);
              arrowClick = false;
            }
            var date = scope.moment;

            switch (view) {
              case 'year':
                scope.years = momentUtils.getVisibleYears(date, scope.local);
                break;
              case 'month':
                scope.months = momentUtils.getVisibleMonths(date, scope.local);
                break;
              case 'date':
                scope.weekdays = scope.weekdays || momentUtils.getDaysOfWeek(null, scope.local);
                scope.weeks = momentUtils.getVisibleWeeks(date, scope.local);
                break;
              case 'hours':
                scope.hours = momentUtils.getVisibleHours(date, scope.local);
                break;
              case 'minutes':
                scope.minutes = momentUtils.getVisibleMinutes(date, step, scope.local);
                break;
            }
          }

          function watch() {
            if (scope.view !== 'date') {
              return scope.view;
            }
            return scope.moment ? scope.moment.month() : null;
          }

          scope.$watch(watch, update);

          scope.next = function (delta) {
            var date = scope.moment;
            delta = delta || 1;
            switch (scope.view) {
              case 'year':
                date.add(delta, 'years');
                break;
              case 'month':
                date.add(delta, 'months');
                break;
              case 'date':
                date.add(delta, 'months');
                break;
              case 'hours':
                date.add(delta, 'days');
                break;
              case 'minutes':
                date.add(delta, 'hours');
                break;
            }
            arrowClick = true;
            update();
          };

          scope.prev = function (delta) {
            return scope.next(-delta || -1);
          };

          scope.isAfter = function (date) {
            return scope.after && momentUtils.isAfter(date, scope.after, scope.local);
          };

          scope.isBefore = function (date) {
            return scope.before && momentUtils.isBefore(date, scope.before, scope.local);
          };

          scope.isSameMonth = function (date) {
            return momentUtils.isSameMonth(scope.model, date, scope.local);
          };

          scope.isSameYear = function (date) {
            return momentUtils.isSameYear(scope.model, date, scope.local);
          };

          scope.isSameDay = function (date) {
            return momentUtils.isSameDay(scope.model, date, scope.local);
          };

          scope.isSameHour = function (date) {
            return momentUtils.isSameHour(scope.model, date, scope.local);
          };

          scope.isSameMinutes = function (date) {
            return momentUtils.isSameMinutes(scope.model, date, scope.local);
          };

          scope.isNow = function (date) {
            var is = true;
            var now = scope.now;
            //noinspection FallThroughInSwitchStatementJS
            switch (scope.view) {
              case 'minutes':
                is &= ~~(date.minutes() / step) === ~~(now.minutes() / step);
              /*falls through*/
              case 'hours':
                is &= date.hours() === now.hours();
              /*falls through*/
              case 'date':
                is &= date.date() === now.date();
              /*falls through*/
              case 'month':
                is &= date.month() === now.month();
              /*falls through*/
              case 'year':
                is &= date.year() === now.year();
            }
            return is;
          };

          function newMoment(options) {
            return momentUtils.createMoment(options, scope.local);
          }
        }
      };
    }]);

'use strict';

var PRISTINE_CLASS = 'ng-pristine',
  DIRTY_CLASS = 'ng-dirty';

var Module = angular.module('momentPicker');

Module.constant('momentTimeConfig', {
  template: function (attrs) {
    return '' +
      '<div ' +
      'moment-picker="' + attrs.ngModel + '" ' +
      (attrs.view ? 'view="' + attrs.view + '" ' : '') +
      (attrs.maxView ? 'max-view="' + attrs.maxView + '" ' : '') +
      (attrs.autoClose ? 'auto-close="' + attrs.autoClose + '" ' : '') +
      (attrs.template ? 'template="' + attrs.template + '" ' : '') +
      (attrs.minView ? 'min-view="' + attrs.minView + '" ' : '') +
      (attrs.partial ? 'partial="' + attrs.partial + '" ' : '') +
      (attrs.step ? 'step="' + attrs.step + '" ' : '') +
      (attrs.local ? 'local="' + attrs.local + '" ' : '') +
      'class="date-picker-date-time"></div>';
  },
  format: 'yyyy-MM-dd HH:mm',
  views: ['date', 'year', 'month', 'hours', 'minutes'],
  dismiss: false,
  position: 'relative'
});

Module.directive('momentTimeAppend', function () {
  return {
    link: function (scope, element) {
      element.bind('click', function () {
        element.find('input')[0].focus();
      });
    }
  };
});

Module.directive('momentTime', ['$compile', '$document', '$filter', 'momentTimeConfig', '$parse', 'momentUtils',
  function ($compile, $document, $filter, momentTimeConfig, $parse, momentUtils) {
    var body = $document.find('body');
    var localFilter = $filter('moment');
    var utcFilter = $filter('momentUTC');

    return {
      require: 'ngModel',
      link: function (scope, element, attrs, ngModel) {
        var format = attrs.format || momentTimeConfig.format;
        var parentForm = element.inheritedData('$formController');
        var views = $parse(attrs.views)(scope) || momentTimeConfig.views.concat();
        var view = attrs.view || views[0];
        var index = views.indexOf(view);
        var dismiss = attrs.autoClose ? $parse(attrs.autoClose)(scope) : momentTimeConfig.autoClose;
        var local = attrs.local ? $parse(attrs.local)(scope) : momentTimeConfig.local;
        var picker = null;
        var position = attrs.position || momentTimeConfig.position;
        var container = null;

        if (index === -1) {
          views.splice(index, 1);
        }

        views.unshift(view);


        function formatter(value) {
          if(local){
            return localFilter(value, format);
          }
          else {
            return utcFilter(value, format);
          }
        }

        function parser() {
          return ngModel.$modelValue;
        }

        ngModel.$formatters.push(formatter);
        ngModel.$parsers.unshift(parser);

        if (angular.isDefined(attrs.minMoment)) {
          var minVal = momentUtils.createMoment(attrs.minMoment, local);

          ngModel.$validators.min = function (value) {
            return !momentUtils.isValidDate(value) || angular.isUndefined(minVal) || value.isSame(minVal) || value.isAfter(minVal);
          };
          attrs.$observe('minMoment', function (val) {
            minVal = momentUtils.createMoment(val, local);
            ngModel.$validate();
          });
        }

        if (angular.isDefined(attrs.maxMoment)) {
          var maxVal = new Date(attrs.maxMoment);
          ngModel.$validators.max = function (value) {
            return !momentUtils.isValidDate(value) || angular.isUndefined(maxVal) || value.isSame(maxVal) || value.isBefore(maxVal);
          };
          attrs.$observe('maxMoment', function (val) {
            maxVal = momentUtils.createMoment(val, local);
            ngModel.$validate();
          });
        }
        //end min, max date validator

        var template = momentTimeConfig.template(attrs);

        function updateInput(event) {
          event.stopPropagation();
          if (ngModel.$pristine) {
            ngModel.$dirty = true;
            ngModel.$pristine = false;
            element.removeClass(PRISTINE_CLASS).addClass(DIRTY_CLASS);
            if (parentForm) {
              parentForm.$setDirty();
            }
            ngModel.$render();
          }
        }

        function clear() {
          if (picker) {
            picker.remove();
            picker = null;
          }
          if (container) {
            container.remove();
            container = null;
          }
        }

        function showPicker() {
          if (picker) {
            return;
          }
          // create picker element
          picker = $compile(template)(scope);
          scope.$digest();

          scope.$on('setDate', function (event, date, view) {
            updateInput(event);
            if (dismiss && views[views.length - 1] === view) {
              clear();
            }
          });

          scope.$on('hidePicker', function () {
            element.triggerHandler('blur');
          });

          scope.$on('$destroy', clear);

          // move picker below input element

          if (position === 'absolute') {
            var pos = angular.extend(element.offset(), { height: element[0].offsetHeight });
            picker.css({ top: pos.top + pos.height, left: pos.left, display: 'block', position: position});
            body.append(picker);
          } else {
            // relative
            container = angular.element('<div date-picker-wrapper></div>');
            element[0].parentElement.insertBefore(container[0], element[0]);
            container.append(picker);
//          this approach doesn't work
//          element.before(picker);
            picker.css({top: element[0].offsetHeight + 'px', display: 'block'});
          }

          picker.bind('mousedown', function (evt) {
            evt.preventDefault();
          });
        }

        element.bind('focus', showPicker);
        element.bind('blur', clear);
      }
    };
  }]);
