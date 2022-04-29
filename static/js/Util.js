/**
 * Copyright (c) 2013 Christopher Keefer. All Rights Reserved.
 */

/**
 * Cover flow jquery plugin - created as a side project.
 *
 * Usage:
 * $('coverflowcontainerelements').coverflow({options});
 * OR
 * $.coverflow({'el':$('coverflowcontainerelements'), ...});
 */
(function($){
    function ACoverflow(options)
    {
        var that = this;
        this.options = $.extend({
            'itemclass':'.flowme',
            'sliderclass':'.coverbar'
        }, (options || {}));
        this.slider = null;

        if (!this.options.el || !(this.options.el instanceof $) || this.options.el.length == 0)
        {
            console.log("No cover flow element(s) selected.");
            return false;
        }

        this.options.el.each(function(){
            var items = $(this).find(that.options.itemclass);
            that.doFlow(items.eq(items.length/2 | 0));
            that.handleSlider($(this), items);

            $(this).on('click touchstart', that.options.itemclass+':not(.active)', function(){
                that.doFlow($(this));
            });
            // Handle mousewheel scrolling
            $(this).on('mousewheel DOMMouseScroll', function(event){
                event.preventDefault();
                event = event.originalEvent;
                var dir = (event.type == "DOMMouseScroll") ? (event.detail > 0) ? 1 : 0 :
                    (event.wheelDelta/120 > 0) ? 1 : 0;
                (dir) ?
                    // Going up/left
                        that.doFlow($(this).find(that.options.itemclass+'.active').next())
                    :
                    // Going down/right
                    that.doFlow($(this).find(that.options.itemclass+'.active').prev());
            });
        });
    }

    ACoverflow.prototype.doFlow = function(centreItem)
    {
        // Apply transforms to center selected item and create 'tilted' effect on left and right items
        if (!centreItem.hasClass('active'))
        {
            var leftItems = centreItem.prevAll(this.options.itemclass),
                rightItems = centreItem.nextAll(this.options.itemclass),
                currentActiveIndex = centreItem.parent().find('.active').index();

            centreItem.css('transform', 'translateX(0px) rotateY(0deg) translateZ(0)');

            leftItems.each(function(index){
                $(this).css('transform',
                    "translateX("+((index+1)*-200)+"px) rotateY(40deg) translateZ(-200px)");
            });
            rightItems.each(function(index){
                $(this).css('transform',
                    "translateX("+((index+1)*200)+"px) rotateY(-40deg) translateZ(-200px)");
            });
            centreItem.addClass('active').siblings('.active').removeClass('active');

            // Adjust slider
            if (this.slider && !this.slider.dragging)
            {
                var dir = centreItem.parent().find('.active').index() - currentActiveIndex;
                this.slider.goToNotch(dir);
            }
        }
    };

    /**
     * Handle the slider control - assign notches to flow items to determine when to switch
     * from one element to another on slide. Listen for mouse and touch events.
     * @param el
     * @param items
     */
    ACoverflow.prototype.handleSlider = function(el, items){
        var that = this;

        this.slider = el.parent().find(this.options.sliderclass).find('.slider').first();
        this.slider.centrePoint = this.slider.parent().width()/2 + this.slider.width()/2;
        this.slider.threshold = this.slider.parent().width()/items.length | 0;
        this.slider.css('left', this.slider.centrePoint+'px');
        this.slider.notches = (function(){
            var centreItem = items.eq(items.length/2 | 0),
                leftItems = centreItem.prevAll(that.options.itemclass),
                rightItems = centreItem.nextAll(that.options.itemclass),
                offsets = [];
            for (var i = leftItems.length; i > 0; i--)
            {
                offsets.push(that.slider.centrePoint - i * that.slider.threshold);
            }
            offsets.push(that.slider.centrePoint);
            rightItems.each(function(index){
                offsets.push(that.slider.centrePoint + (index+1) * that.slider.threshold);
            });
            return offsets;
        })();
        this.slider.currentNotch = items.length/2 | 0;
        this.slider.parent().on('mousedown touchstart', function(event){
            // If event is a touch event, set event to equal the first touch event
            if (event.originalEvent.changedTouches && event.originalEvent.changedTouches.length) {
                event = event.originalEvent.changedTouches[0];
            }
            that.slider.dragging = true;
            that.slider.dragStart = that.slider.offset().left + that.slider.width()/2;
        });
        // Listen for mouse/touchmove and up/end on document so that we don't miss the mouse end events,
        // and can perform a 'lazy-y axis slide' where moving the mouse off the slider while holding it down
        // still performs a slide on the control, as it does on standard window controls.
        $(document).on('mousemove touchmove', function(event){
            if (event.originalEvent.changedTouches && event.originalEvent.changedTouches.length) {
                event = event.originalEvent.changedTouches[0];
            }
            var movePoint = event.pageX-that.slider.width()/2;
            that.slider.dragging && that.slider.move(movePoint);

            if (that.slider.dragging && movePoint >
                (that.slider.notches[that.slider.currentNotch] + that.slider.threshold))
            {
                that.doFlow(that.options.el.find(that.options.itemclass+'.active').next());
                that.slider.currentNotch += (that.slider.notches[that.slider.currentNotch+1]) ? 1 : 0;
            }
            else if (that.slider.dragging && movePoint <
                (that.slider.notches[that.slider.currentNotch] - that.slider.threshold+that.slider.width()/2))
            {
                that.doFlow(that.options.el.find(that.options.itemclass+'.active').prev());
                that.slider.currentNotch -= (that.slider.notches[that.slider.currentNotch-1]) ? 1 : 0;
            }
        });
        $(document).on('mouseup touchend', function(){
            that.slider.dragging = false;
        });

        /**
         * Move slider, clamp to left and max values of slider container.
         * @param offset
         */
        this.slider.move = function(offset){
            var pLeft = this.parent().offset().left,
                max = pLeft+this.parent().width()-this.width();
            if (offset > pLeft && offset < max)
            {
                this.css('left', offset);
            }
            else
            {
                (offset < pLeft) ? this.css('left', pLeft) : this.css('left', max);
            }
        };

        /**
         * Go to the notch specified by dir
         * @param {Number} dir Increases or decreases the notch based on what flow item was selected.
         */
        this.slider.goToNotch = function(dir)
        {
            this.currentNotch += dir;
            this.move(this.notches[this.currentNotch]);
        }
    };

    $.coverflow = function(options){
        new ACoverflow(options);
    };

    $.fn.coverflow = function(options)
    {
        options = (options || {});
        options.el = $(this);
        return $.coverflow(options);
    };
})(jQuery);