﻿define(['jQuery', 'libraryBrowser', 'scrollStyles'], function ($, libraryBrowser) {

    function enableScrollX() {
        return browserInfo.mobile && AppInfo.enableAppLayouts;
    }

    function getPortraitShape() {
        return enableScrollX() ? 'overflowPortrait' : 'portrait';
    }

    function getThumbShape() {
        return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
    }

    function getSquareShape() {
        return enableScrollX() ? 'overflowSquare' : 'square';
    }

    function getLimit() {

        return enableScrollX() ? 12 : 8;
    }

    function loadRecommendedPrograms(page) {

        Dashboard.showLoadingMsg();

        ApiClient.getLiveTvRecommendedPrograms({

            userId: Dashboard.getCurrentUserId(),
            IsAiring: true,
            limit: getLimit() * 2,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary",
            EnableTotalRecordCount: false

        }).then(function (result) {

            renderItems(page, result.Items, 'activeProgramItems', 'play');
            Dashboard.hideLoadingMsg();
        });
    }

    function reload(page) {

        loadRecommendedPrograms(page);

        ApiClient.getLiveTvRecommendedPrograms({

            userId: Dashboard.getCurrentUserId(),
            IsAiring: false,
            HasAired: false,
            limit: getLimit(),
            IsMovie: false,
            IsSports: false,
            IsKids: false,
            IsSeries: true,
            EnableTotalRecordCount: false

        }).then(function (result) {

            renderItems(page, result.Items, 'upcomingProgramItems');
        });

        ApiClient.getLiveTvRecommendedPrograms({

            userId: Dashboard.getCurrentUserId(),
            IsAiring: false,
            HasAired: false,
            limit: getLimit(),
            IsMovie: true,
            EnableTotalRecordCount: false

        }).then(function (result) {

            renderItems(page, result.Items, 'upcomingTvMovieItems', null, getPortraitShape());
        });

        ApiClient.getLiveTvRecommendedPrograms({

            userId: Dashboard.getCurrentUserId(),
            IsAiring: false,
            HasAired: false,
            limit: getLimit(),
            IsSports: true,
            EnableTotalRecordCount: false

        }).then(function (result) {

            renderItems(page, result.Items, 'upcomingSportsItems');
        });

        ApiClient.getLiveTvRecommendedPrograms({

            userId: Dashboard.getCurrentUserId(),
            IsAiring: false,
            HasAired: false,
            limit: getLimit(),
            IsKids: true,
            EnableTotalRecordCount: false

        }).then(function (result) {

            renderItems(page, result.Items, 'upcomingKidsItems');
        });
    }

    function renderItems(page, items, sectionClass, overlayButton, shape) {

        var html = libraryBrowser.getPosterViewHtml({
            items: items,
            shape: shape || (enableScrollX() ? getSquareShape() : 'auto'),
            showTitle: true,
            centerText: true,
            coverImage: true,
            overlayText: false,
            lazy: true,
            overlayMoreButton: overlayButton != 'play',
            overlayPlayButton: overlayButton == 'play'
        });

        var elem = page.querySelector('.' + sectionClass);

        elem.innerHTML = html;
        ImageLoader.lazyChildren(elem);
    }

    return function (view, params) {

        var self = this;

        self.initTab = function () {

            var tabContent = view.querySelector('.pageTabContent[data-index=\'' + 0 + '\']');
            if (enableScrollX()) {
                $('.itemsContainer', tabContent).addClass('hiddenScrollX').createCardMenus();
            } else {
                $('.itemsContainer', tabContent).removeClass('hiddenScrollX').createCardMenus();
            }
        };

        self.renderTab = function () {
            var tabContent = view.querySelector('.pageTabContent[data-index=\'' + 0 + '\']');
            reload(tabContent);
        };

        var tabControllers = [];
        var renderedTabs = [];

        function loadTab(page, index) {

            var tabContent = page.querySelector('.pageTabContent[data-index=\'' + index + '\']');
            var depends = [];

            switch (index) {

                case 0:
                    break;
                case 1:
                    depends.push('scripts/livetvguide');
                    break;
                case 2:
                    depends.push('scripts/livetvchannels');
                    depends.push('paper-icon-item');
                    depends.push('paper-item-body');
                    break;
                case 3:
                    depends.push('scripts/livetvrecordings');
                    break;
                case 4:
                    depends.push('scripts/livetvseriestimers');
                    break;
                default:
                    break;
            }

            require(depends, function (controllerFactory) {

                if (index == 0) {
                    self.tabContent = tabContent;
                }
                var controller = tabControllers[index];
                if (!controller) {
                    controller = index ? new controllerFactory(view, params, tabContent) : self;
                    tabControllers[index] = controller;

                    if (controller.initTab) {
                        controller.initTab();
                    }
                }

                if (renderedTabs.indexOf(index) == -1) {
                    renderedTabs.push(index);
                    controller.renderTab();
                }
            });
        }

        var mdlTabs = view.querySelector('.libraryViewNav');

        var baseUrl = 'tv.html';
        var topParentId = params.topParentId;
        if (topParentId) {
            baseUrl += '?topParentId=' + topParentId;
        }

        libraryBrowser.configurePaperLibraryTabs(view, mdlTabs, view.querySelectorAll('.pageTabContent'), [0, 2, 3, 4]);

        mdlTabs.addEventListener('tabchange', function (e) {
            loadTab(view, parseInt(e.detail.selectedTabIndex));
        });

        view.addEventListener('viewshow', function (e) {

            // Needed on the guide tab
            // Ideally this should be moved to the guide tab on show/hide
            document.body.classList.add('autoScrollY');
        });

        view.addEventListener('viewbeforehide', function (e) {

            document.body.classList.remove('autoScrollY');
        });

        view.addEventListener('viewdestroy', function (e) {

            tabControllers.forEach(function (t) {
                if (t.destroy) {
                    t.destroy();
                }
            });
        });
    };
});