
// TODO: Allow the user to customize the color of the article view.
// TODO: Allow the users to report bugs and request features.

(function()
{
   "use strict";



   ////////////////////////////////////////////////////////////////////////////
   // @brief   Singleton Class
   ////////////////////////////////////////////////////////////////////////////

   window.ArticleView = function()
   {
      if( !ArticleView.prototype._articleViewInstance )
      {
         ArticleView.prototype._articleViewInstance = this;

         this._createView();

         // Create and attach the iframe to the body first (which is necessary
         // for modifying its content.)
         this.$frame = this._createAndAppendFrame();
         this.$frame.contents().find("body").append( this.$view );
      }

      return ArticleView.prototype._articleViewInstance;
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._createAndAppendFrame = function()
   {
      var style = "\
                  display: block; \
                  position: fixed; \
                  z-index: 2147483647; \
                  top: 0; \
                  left: 0; \
                  width: 100%; \
                  height: 100%; \
                  background-color: gray; \
                  ";

      var $frame = $("<iframe" +
                        " frameborder=0" +
                        " style='" + style + "'" +
                     "></iframe>" );

      // Attach the iframe to the DOM tree, but don't display it yet.
      // Note: The iframe has to be part of the DOM tree in order to modify it content.
      $frame.hide();
      $(document.body).append( $frame );

      // Note: The DOCTYPE is necessary for the stylesheet to work.
      var sFrameContent =
         "<!DOCTYPE html>" +
         "<html>" +
            "<head>" +
               "<link href='http://fonts.googleapis.com/css?family=Droid+Serif' rel='stylesheet' type='text/css'>" +
               "<link type='text/css' rel='stylesheet' href='" +
                  chrome.extension.getURL( "css/style.css" ) +
               "'></link>" +
            "</head>" +
            "<body>" +
            "</body>" +
         "</html>";

      $frame[0].contentWindow.document.open();
      $frame[0].contentWindow.document.write( sFrameContent );
      $frame[0].contentWindow.document.close();

      return $frame;
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._createView = function()
   {
      // Note: Always use lower case in id and class to avoid case-sensitivity
      //       issue that can cause CSS selectors to not work.

      var $view = $(
         "<div id='article_view' class='sans_serif'>" +

            "<div id='article_view_dialog'>" +

               "<div id='article'>" +
                  "<div id='article_title'></div>" +
                  "<div id='article_content'></div>" +
                  "<div id='column_width_ruler'></div>" +
               "</div>" +

               "<div id='article_view_menu'>" +
                  "<span class='button' id='close_button'></span>" +
                  "<span class='button' id='right_column_button'></span>" +
                  "<span class='button' id='left_column_button'></span>" +
                  "<span class='button' id='full_screen_button'></span>" +

                  "<span class='button' id='text_style_button'></span>" +
                  "<div id='text_style_menu' style='display: none;'>" +
                     "<div class='text_style_menu_section' id='font_family_setting'>" +
                        "<div class='control_label'>Font Family</div>" +
                        "<span class='control_button' id='sans_serif_button'>Sans Serif</span>" +  // minus
                        "<span class='control_button' id='serif_button'>Serif</span>" +
                     "</div>" +
                     "<div class='text_style_menu_section' id='font_size_setting'>" +
                        "<div class='control_label'>Font Size</div>" +
                        "<span class='control_button' id='decrease_font_size_button'> &#8722; </span>" +  // minus
                        "<span id='current_font_size'> 15 </span>" +
                        "<span class='control_button' id='increase_font_size_button'> &#43; </span>" +    // plus
                     "</div>" +
                     "<div class='down_arrow'></div>" +
                  "</div>" +

               "</div>" +

            "</div>" +

         "</div>" );

      var $dialog = $view.find( "#article_view_dialog" );
      var $menu   = $view.find( "#article_view_menu" );

      this._initializeViewEventHandling( $view, $dialog );
      this._initializeDialogEventHandling( $dialog );
      this._initializeMenuEventHandling( $menu, $view );

      // Intialize data members.
      this.$view            = $view;
      this.$dialog          = $dialog;
      this.$menu            = $menu;
      this.$article         = $view.find( "#article" );
      this.$articleTitle    = $view.find( "#article_title" );
      this.$articleContent  = $view.find( "#article_content" );
      this.$colWidthRuler   = $view.find( "#column_width_ruler" );
      this.$currentFontSize = $view.find( "#current_font_size" );
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._initializeViewEventHandling = function( $view, $dialog )
   {
      var self = this;

      // The view can be closed by clicking on outside the dialog.
      $view.click( function( oEvent )
      {
         if(    $dialog.has( oEvent.target ).length === 0
             && $dialog.is( oEvent.target ) === false )
         {
            self._deactivate();
         }
      });
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._initializeDialogEventHandling = function( $dialog )
   {
      var self = this;

      // Scrolling down will move the next column toward the left.
      var iPreviousMouseWheelEventTimestamp = 0;
      $dialog.bind( "mousewheel", function( oEvent )
      {
         // Note: Don't trigger the mousewheel event handler too often.
         if( oEvent.timeStamp - iPreviousMouseWheelEventTimestamp > 300 )
         {
            iPreviousMouseWheelEventTimestamp = oEvent.timeStamp;

            ( oEvent.originalEvent.wheelDelta > 0 ) ? self._moveColumnTowardRight()
                                                    : self._moveColumnTowardLeft();
         }
      });

      // Resize the dialog every time the window is resized.
      $(window).resize( function()
      {
         self._maximizeAndCenterDialog();
      });
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._initializeMenuEventHandling = function( $menu, $view )
   {
      var self = this;

      // Find all the control elements.

      var $closeButton            = $menu.find( "#close_button"        );
      var $rightColButton         = $menu.find( "#right_column_button" );
      var $leftColButton          = $menu.find( "#left_column_button"  );
      var $fullScrButton          = $menu.find( "#full_screen_button"  );
      var $textStyleButton        = $menu.find( "#text_style_button"   );

      var $textStyleMenu          = $menu.find( "#text_style_menu"           );
      var $increaseFontSizeButton = $menu.find( "#increase_font_size_button" );
      var $decreaseFontSizeButton = $menu.find( "#decrease_font_size_button" );
      var $sansSerifButton        = $menu.find( "#sans_serif_button"         );
      var $serifButton            = $menu.find( "#serif_button"              );

      // Add menu button handlers.

                 $closeButton.click( function() { self._deactivate();                       } );
              $rightColButton.click( function() { self._moveColumnTowardLeft();             } );
               $leftColButton.click( function() { self._moveColumnTowardRight();            } );
               $fullScrButton.click( function() { self.$frame[0].webkitRequestFullScreen(); } );

      $increaseFontSizeButton.click( function() { self._increaseFontSize();                 } );
      $decreaseFontSizeButton.click( function() { self._decreaseFontSize();                 } );

             $sansSerifButton.click( function() { self._setSansSerifFont();                 } );
                 $serifButton.click( function() { self._setSerifFont();                     } );

      // Add keyboard shortcuts.

      var LEFT_ARROW_KEY = 37;
      var RIGHT_ARROW_KEY = 39;

      $(document).keydown( function(e)
      {
         if( self._isActivated() )
         {
            switch( e.keyCode )
            {
               case LEFT_ARROW_KEY:
                  self._moveColumnTowardRight();
                  return false;
               case RIGHT_ARROW_KEY:
                  self._moveColumnTowardLeft();
                  return false;
               default:
                  // Nothing
            }
         }
      });

      // Add menu activation/deactivation handlers.

      $textStyleButton.click( function()
      {
         $textStyleMenu.fadeIn();
         return false;
      } );

      $view.click( function( oEvent )
      {
         if(    $textStyleMenu.has( oEvent.target ).length === 0
             && $textStyleMenu.is( oEvent.target ) === false )
         {
            $textStyleMenu.fadeOut();
         }
      });

   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._changeFontSize = function( iDiff )
   {
      var $html            = this.$view.closest("html");
      var iRootFontSize    = parseInt( $html.css( "font-size" ), 10 );
      var iNewRootFontSize = Math.max( 1, iRootFontSize + iDiff );  // lower bound

      $html.css( "font-size", iNewRootFontSize + "px" );

      chrome.extension.sendMessage(
         { action : "setLocalStorage",
           name   : "PurifySettingRootFontSize",
           value  : iNewRootFontSize }
      );

      this.$currentFontSize.text( iNewRootFontSize );

      this._maximizeAndCenterDialog();
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._increaseFontSize = function()
   {
      this._changeFontSize( 1 );
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._decreaseFontSize = function()
   {
      this._changeFontSize( -1 );
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._setFontFamily = function( sFontFamilyClass )
   {
      this.$view.removeClass();
      this.$view.addClass( sFontFamilyClass );

      chrome.extension.sendMessage(
         { action : "setLocalStorage",
           name   : "PurifySettingRootFontFamily",
           value  : sFontFamilyClass }
      );

      this._maximizeAndCenterDialog();
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._setSansSerifFont = function()
   {
      this._setFontFamily( "sans_serif" );
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._setSerifFont = function()
   {
      this._setFontFamily( "serif" );
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype.activate = function()
   {
      var self            = this;
      var oArticle        = (new ArticleParser()).getArticle();
      var $articleTitle   = oArticle.$title;
      var $articleContent = oArticle.$content;

      if( $articleContent.length > 0 )
      {
         self._applySavedSetting();

         self.$dialog.hide();
         self.$article.hide();

         self.$frame.fadeIn( "fast", function()
         {
            $("html").css( "overflow", "hidden" );  // Hide the scrollbar

            self._maximizeAndCenterDialog();
            self.$dialog.fadeIn( "", function()
            {
               // Note: $.append() might generate syntax error.

               if( $articleTitle[0] )
               {
                  self.$articleTitle.html( "" );
                  self.$articleTitle[0].appendChild( $articleTitle[0] );
               }

               if( $articleContent[0] )
               {
                  self.$articleContent.html( "" );
                  self.$articleContent[0].appendChild( $articleContent[0] );
               }

               self.$article.fadeIn();
            });
         });
      }
      else
      {
         // Content is always available even if this is not an article.
      }
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._applySavedSetting = function()
   {
      var self = this;

      chrome.extension.sendMessage(
         { action : "getLocalStorage",
           name   : "PurifySettingRootFontSize" },
         function( oResponse )
         {
            if( oResponse.PurifySettingRootFontSize )
            {
               var iCurrentFontSize = oResponse.PurifySettingRootFontSize;
               var $html = self.$view.closest("html");

               $html.css( "font-size", iCurrentFontSize + "px" );
               self.$currentFontSize.text( iCurrentFontSize );
            }
         }
      );

      chrome.extension.sendMessage(
         { action : "getLocalStorage",
           name   : "PurifySettingRootFontFamily" },
         function( oResponse )
         {
            if( oResponse.PurifySettingRootFontFamily )
            {
               self.$view.removeClass();
               self.$view.addClass( oResponse.PurifySettingRootFontFamily );
            }
         }
      );
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._maximizeAndCenterDialog = function()
   {
      var $container = this.$dialog;
      var $window = $(window);

      var iWindowWidth  = window.innerWidth  || $window.width();
      var iWindowHeight = window.innerHeight || $window.height();  // $window.height() could return a much bigger value.

      var iHorizontalPadding = $container.outerWidth()  - $container.width();
      var iVerticalPadding   = $container.outerHeight() - $container.height();

      var MARGIN = 20;   // px; top + bottom; left + right

      $container.width(  iWindowWidth  - (MARGIN * 2) - iHorizontalPadding );
      $container.height( iWindowHeight - (MARGIN * 2) - iVerticalPadding   );

      $container.css( { "left" : MARGIN + "px" } );
      $container.css( { "top"  : MARGIN + "px" } );
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._deactivate = function()
   {
      $("html").css( "overflow", "" );

      this.$frame.fadeOut( "", function()
      {
         document.webkitCancelFullScreen();
      });
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._isActivated = function()
   {
      return this.$frame.css( "display" ) !== "none";
   }



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._moveColumnHorizontally = function( towardLeft )
   {
      var iLeftScrollPosition = this.$dialog.scrollLeft();
      var iTotalColumnWidth   = this._getColumnWidth() + this._getColumnGap();

      var iNewLeftScrollPosition = towardLeft ? iLeftScrollPosition + iTotalColumnWidth
                                              : iLeftScrollPosition - iTotalColumnWidth;

      this.$dialog.animate( { "scrollLeft" : iNewLeftScrollPosition },
                              "fast",
                              "swing" );
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._moveColumnTowardLeft = function()
   {
      this._moveColumnHorizontally( true );
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._moveColumnTowardRight = function()
   {
      this._moveColumnHorizontally( false );
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._getColumnWidth = function()
   {
      return this.$colWidthRuler.width();  // integer
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleView.prototype._getColumnGap = function()
   {
      return parseInt( this.$article.css("margin-right"), 10);
   };



})();
