angular.module('neoApp', ['ui', 'ngGrid'])
    .controller('NeoCtrl', function($scope, $http) {
	var crntCode = "";
	$scope.code = "";//"g.v(1107).in('CHILD_OF').filter{it.type=='protocol'}.loop(2){it.object.out('CHILD_OF').count() > 0}{true}.collect{[id:it.id, name:it.name, bytes:it.bytes]}";
	$scope.commandHistory = {crnt: 0,stack: []};
	$scope.settings = { url: 'http://127.0.0.1:7474/db/data/ext/GremlinPlugin/graphdb/execute_script'};
	$scope.sendCode = function(code) {
	    function handleResponse(code, response, extras) {
		angular.element('.resultsContainer li').each(function(i, e) {
		    angular.element(this).scope().show = false;			
		});
		$scope.commandHistory.stack.push(angular.extend({code: code, result: response}, extras || {}));
		$scope.commandHistory.crnt = $scope.commandHistory.stack.length;
	    }
	    $http.post($scope.settings.url, {script: code, params: {}})
		.success(function(response) {
		    if (angular.isArray(response) && response.length > 0 && response[0].outgoing_relationships) {
			var items = [], item, i;
			for( i = 0; i < response.length; i++) {
			    items.push(response[i].data);
			}
			response = items;
		    }
		    handleResponse(code, response);
		    $scope.code='';
		})
		.error(function(response) {
		    handleResponse(code, response, {isError: true});
		    console.log('error', arguments);
		});
	};
	$scope.keypress = function(event, code) {
	    if (event.ctrlKey && event.keyCode) {
		switch(event.keyCode) {
		case 13: // ctrl + enter
		    $scope.sendCode(code);
		    break;
		case 38: // ctrl + up arrow
		    $scope.historyPrev();
		    break;
		case 40: // ctrl + down arrow
		    $scope.historyNext();
		    break;
		}
	    }
	    return true;
	};
	
	$scope.historyPrev = function() {
	    if ($scope.commandHistory.stack.length) {
		if ($scope.commandHistory.crnt == $scope.commandHistory.stack.length) {
		    // save the new code that's not yet part of the history before navigating to the previous code
		    crntCode = $scope.code;
		}
		
		$scope.commandHistory.crnt -= 1;
		if ($scope.commandHistory.crnt < 0) {
		    // prevent the crnt from decrementing below 0
		    $scope.commandHistory.crnt = 0;
		}
		$scope.code = $scope.commandHistory.stack[$scope.commandHistory.crnt].code;
	    }
	};
	$scope.historyNext = function() {
	    if ($scope.commandHistory.stack.length) {
		$scope.commandHistory.crnt += 1
		if ($scope.commandHistory.crnt >= $scope.commandHistory.stack.length) {
		    // prevent the crnt from incrementing past the length of the history stack
		    $scope.code = crntCode;
		    $scope.commandHistory.crnt = $scope.commandHistory.stack.length;
		} else {
		    $scope.code = $scope.commandHistory.stack[$scope.commandHistory.crnt].code;
		}
	    }
	};

	$scope.$watch('commandHistory.crnt', function(newVal, oldVal) {
	    var stackPositionVal = $scope.commandHistory.stack[newVal],
	    stackPositionCode = stackPositionVal ? stackPositionVal.code : '';

	    // debug logging
	    /*if ($scope.commandHistory.stack.length === oldVal) {
	      console.log('was', oldVal, 'unsaved code');
	      } else {
	      console.log('was', oldVal, $scope.commandHistory.stack[oldVal]);
	      }
	      if ($scope.commandHistory.stack.length === newVal) {
	      console.log('now', newVal, 'unsaved code');
	      } else {
	      console.log('now', newVal, stackPositionCode);
	      }*/
	});

	// WIDGET OPTIONS
	$scope.editorOptions = {
	    lineWrapping: true,
	    lineNumbers: true,
	    mode: 'groovy',
	    keyMap: 'emacs',
	    autofocus: true,
	    onFocus: function(event) {
		// store a reference to the CodeMirror instance's doc
		$scope.editorOptions.doc = event.doc;
	    }
	    //onCursorActivity: function(event) {
		//$scope.editorOptions.cursorPos = event.getCursor();
		/*var cursorPos = event.getCursor(),
		line = event.getLine(cursorPos.line);
		console.log(cursorPos);
		if (cursorPos.line == 0 && cursorPos.ch == 0) {
		    $scope.historyPrev();
		} 
		
		if (cursorPos.ch == line.length) {
		    console.log('next');
		    $scope.historyNext();
		}
	    }*/
	};
	$scope.historyGridOpts = {
	    data: 'commandHistory.stack',
	    columnDefs: [{field: 'code', displayName: 'code'}],
	    multiSelect: false,
	    afterSelectionChange: function(rowItem) {
		$scope.code = rowItem.entity.code;
	    }
	};
	commandHistory = $scope.commandHistory;
    })
    .directive('autoScroll', function() {
	return {
	    restrict: 'A',
	    link: function(scope, element, attrs) {
		scope.scrollHeight = function() { return element[0].scrollHeight };
		scope.$watch('scrollHeight()', function(newVal) {
		    element[0].scrollTop = newVal;
		});
	    }
	};
    });