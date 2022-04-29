/**
 * Copyright (c) 2013 Christopher Keefer. All Rights Reserved.
 *
 * Handles the any animated/interactive element of the UI.
 */
function AUi(options){
    var $link = $('link');
    this.options = $.extend({
        debug:true
    }, (options || {}));

    this.baseURL = $link.first().attr('href').substr(0,
        $link.first().attr('href').indexOf('static'));

    this.fadeIn();
}

/**
 * Fade in the .*-ice images, one after another.
 */
AUi.prototype.fadeIn = function(){
    var fadeSeen = localStorage.getItem('fadeSeen');
    (fadeSeen) ? $('.img-ice').removeClass('fade') :
    setTimeout(function(){
        localStorage.setItem('fadeSeen', true);
        $('.img-ice').each(function(){
            $(this).on('transitionend', function(){
                $(this).next('.img-ice').addClass('in');
            });
        }).filter('.left-ice').addClass('in');
    }, 750);
};