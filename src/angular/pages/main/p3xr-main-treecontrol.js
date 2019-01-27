p3xr.ng.component('p3xrMainTree', {
    template: require('./p3xr-main-treecontrol.html'),
    bindings: {
        p3xrResize: '&',
        p3xrMainRef: '<'
    },
    controller: function(p3xrCommon, p3xrRedisParser, p3xrSocket, $rootScope, $timeout,  $state, $scope, $mdDialog, p3xrDialogKeyNewOrSet, p3xrTheme, $stateParams) {

        this.$onInit = () => {
            this.p3xrResize()

        }

        this.getTreeTheme = () => {
            if (!p3xrTheme.isDark())  {
                return 'tree-classic'
            }
            return 'tree-dark'
        }

        this.keysTreeOptions = {
            nodeChildren: "children",
            dirSelectable: false,
            multiSelection: false,
            /*
             injectClasses: {
              ul: "a1",
              li: "a2",
              liSelected: "a7",
              iExpanded: "a3",
              iCollapsed: "a4",
              iLeaf: "a5",
              label: "a6",
              labelSelected: "a8"
            }
             */
        };

        this.selectTreeNode = function(node, selected, $parentNode, $index, $first, $middle, $last, $odd, $even, $path)  {
            //console.warn('selectTreeNode', arguments)
            $state.go('main.key', {
                key: node.key,
                resize:  this.p3xrResize,
            })
        }


        this.showToggle = function(node, expanded, $parentNode, $index, $first, $middle, $last, $odd, $even, $path)  {
          //  console.warn('showToggle', arguments, $path())
            /*
            p3xrCommon.toast({
                message: 'key ' + node.key
            })
            */
        }

        this.delete = async(options) => {
            try {

                await p3xrCommon.confirm({
                    message: p3xr.strings.confirm.deleteKey
                })

                const expandedNodes = angular.copy($rootScope.expandedNodes);

                const response = await p3xrSocket.request({
                    action: 'delete',
                    payload: {
                        key: options.key
                    }
                })

                $timeout(() => {
                    $rootScope.savedExpandedNodes = expandedNodes
                    p3xrCommon.loadRedisInfoResponse({ response: response})
                })

                $state.go('main.statistics')

                p3xrCommon.toast({
                    message: p3xr.strings.status.deletedKey({
                        key: options.key
                    })
                })
            } catch(e) {
                p3xrCommon.generalHandleError(e)
            }

        }


        this.rename = async(options) => {
            try {
                const confirm = $mdDialog.prompt()
                    .title(p3xr.strings.confirm.rename.title)
                    .textContent(p3xr.strings.confirm.rename.textContent)
                    .placeholder(p3xr.strings.confirm.rename.placeholder)
                    .ariaLabel(p3xr.strings.confirm.rename.placeholder)
                    .initialValue(options.key)
                    .targetEvent(options.$event)
                    .required(true)
                    .ok(p3xr.strings.intention.rename)
                    .cancel(p3xr.strings.intention.cancel);

                const confirmResponse = await $mdDialog.show(confirm)

                const expandedNodes = angular.copy($rootScope.expandedNodes);

                const response = await p3xrSocket.request({
                    action: 'rename',
                    payload: {
                        key: options.key,
                        keyNew: confirmResponse,
                    }
                })

                $timeout(() => {
                    $rootScope.savedExpandedNodes = expandedNodes
                    p3xrCommon.loadRedisInfoResponse({ response: response})
                    $state.go('main.key', {
                        key: confirmResponse,
                        resize:  this.p3xrResize,
                    })
                })



                p3xrCommon.toast({
                    message: p3xr.strings.status.renamedKey
                })
            } catch(e) {
                p3xrCommon.generalHandleError(e)
            }

        }

        this.deleteTree = async(options) => {
            try {
                const { event, node} = options
                // event.preventDefault()
                event.stopPropagation();

                const expandedNodes = angular.copy($rootScope.expandedNodes);

                await p3xrCommon.confirm({
                    event: event,
                    message: p3xr.strings.confirm.deleteAllKeys({
                        key: node.key
                    })
                })


                const response = await p3xrSocket.request({
                    action: 'key-del-tree',
                    payload: {
                        key: node.key,
                        redisTreeDivider: p3xr.settings.redisTreeDivider
                    }
                })

                $timeout(() => {
                    $rootScope.savedExpandedNodes = expandedNodes
                    p3xrCommon.loadRedisInfoResponse({ response: response})

                    if ($stateParams.key !== undefined && $stateParams.key.startsWith(node.key + p3xr.settings.redisTreeDivider)) {
                        $state.go('main.statistics')
                    }
                })

                p3xrCommon.toast({
                    message: p3xr.strings.status.treeDeleted({
                        key: node.key
                    })
                })
            } catch(e) {
                p3xrCommon.generalHandleError(e)
            }
        }

        this.extractNodeTooltip = (node) => {
            if (node.type !== 'folder' && node.keysInfo !== undefined) {
                if (node.keysInfo === undefined) {
                    return '';
                }
                return p3xr.ui.htmlEncode(p3xr.strings.redisTypes[node.keysInfo.type ]+ ' - ' + node.key)
            }
            return p3xr.ui.htmlEncode(node.key)
        }


        this.addKey = async (options) => {
            const { event, node} = options
            event.stopPropagation();

            const expandedNodes = angular.copy($rootScope.expandedNodes);

            try {
                const response = await p3xrDialogKeyNewOrSet.show({
                    $event: event,
                    node: node,
                    type: 'add',
                })

                $timeout(() => {
                    $rootScope.savedExpandedNodes = expandedNodes
                    p3xrCommon.loadRedisInfoResponse({ response: response})

                    $state.go('main.key', {
                        key: response.key,
                        resize:  this.p3xrResize,
                    })
                })
            } catch(e) {
                p3xrCommon.generalHandleError(e)
            }
        }



        $scope.$on('p3xr-key-delete', (event, arg) => {
            this.delete(arg)
        });

        $scope.$on('p3xr-key-rename', (event, arg) => {
            this.rename(arg)
        });


        $scope.$on('p3xr-key-new', (event, arg) => {
            this.addKey(arg)
        });


    }
})

