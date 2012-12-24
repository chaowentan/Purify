(function()
{
   "use strict";

   var _IGNORE_CLASS = "nbouibnonwenfofj_igore";

   var _ignoredTags = [
      "SCRIPT", "IFRAME", "STYLE", "OBJECT", "FOOTER", "NAV" ];



   ////////////////////////////////////////////////////////////////////////////
   // @brief   Singleton Class
   ////////////////////////////////////////////////////////////////////////////

   window.ArticleParser = function() {};   // Empty Constructor.



   ////////////////////////////////////////////////////////////////////////////

   ArticleParser.prototype.getArticle = function()
   {
      var $contentContainer = this._findContentContainer();

      this._revertModificationToExistingArticle();

      return { "$title"   : this._getTitle( $contentContainer ),
               "$content" : this._getContent( $contentContainer ) };
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleParser.prototype._revertModificationToExistingArticle = function()
   {
      $("." + _IGNORE_CLASS).removeClass( _IGNORE_CLASS );
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleParser.prototype._findContentContainer = function()
   {
      // Almost all the news sites use <p> for the article paragraphs. If this
      // is no longer true in the future, assume elements with the highest text
      // density are the paragraph elements.

      var $paragraphs = $("p");
      var listOfParagraphContainers = [];

      // Find the containers of all the paragraphs, and make sure they are
      // unique.

      $paragraphs.each( function( index, eParagraph )
      {
         if( !listOfParagraphContainers.some( function( $element ) {
                  return $element.is( eParagraph.parentNode ); } ) )
         {
            listOfParagraphContainers.push( $(eParagraph.parentNode) );
         }
      });

      // Sort the containers based on the number of paragraphs they have (in
      // descending order.)

      listOfParagraphContainers.sort( function( $container1, $container2 )
      {
         return $container2.children( "p" ).length -
                $container1.children( "p" ).length;
      });

      // Some news sites would use the <p> elements very liberally. So we need
      // to make sure the article container not only has the most paragraphs,
      // but also has the most text.

      var $containerWithTheMostParagraphs = $();
      for( var i = 0; i < listOfParagraphContainers.length; i++ )
      {
         var $container = listOfParagraphContainers[i];
         if(    $containerWithTheMostParagraphs.length === 0
             || $container.text().length > $containerWithTheMostParagraphs.text().length * 2 )
         {
            $containerWithTheMostParagraphs = $container;
         }
      }

      // If an article is not found, then just display all the text.

      var $contentContainer = $containerWithTheMostParagraphs;
      if( $contentContainer.length === 0 )
      {
         $contentContainer = $( "<div></div" );
         $contentContainer.html( document.body.innerText.replace( /\n/g, "<br/>") );
      }

      return $contentContainer;
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleParser.prototype._shouldIgnoreElement = function( eElement )
   {

      var shouldIgnore = false;

      if( eElement )
      {
         var $element = $( eElement );

         try
         {
            shouldIgnore = (
                  $element.css( "float" ) === "left"
               || $element.css( "float" ) === "right"
               || $element.css( "position" ) === "absolute"
               || $element.hasClass( _IGNORE_CLASS )
               || _ignoredTags.some( function( sTagName ) { return eElement.tagName === sTagName; } ) );
         }
         catch( exception )
         {
            // jQuery will throw exception probably because it is not fully
            // tested in the Chrome extension environment.
         }
      }

      return shouldIgnore;
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleParser.prototype._getTitle = function( $contentContainer )
   {
      var $title = $();

      if( $contentContainer.length > 0 )
      {
         var $originalPrimaryTitle = this._getPrimaryTitle( $contentContainer );

         var $primaryTitle = $originalPrimaryTitle.clone();

         this._sanitizeElementAndDesendants( $primaryTitle );

         $title = $("<div></div>");
         $title.append( $primaryTitle );
      }

      return $title;
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleParser.prototype._getPrimaryTitle = function( $contentContainer )
   {
      var $title = $();
      var eContentContainer = $contentContainer[0];

      // Find the heading elment that's closest to the content container.

      if( eContentContainer )
      {
         var listOfHeadingElementTags = [ "h1", "h2", "h3" ];
         var listOfHeadingElements = [];

         for( var i = 0;
                 i < listOfHeadingElementTags.length
              && listOfHeadingElements.length === 0;
              i++ )
         {
            listOfHeadingElements = $.makeArray( $( listOfHeadingElementTags[i] ) );
         }

         listOfHeadingElements.sort( function( eElement1, eElement2 )
         {
            var iDistance1 = Util.getDistanceBetweenElements( eElement1, eContentContainer );
            var iDistance2 = Util.getDistanceBetweenElements( eElement2, eContentContainer );

            return iDistance1 - iDistance2;
         });

         var eHeadingElementClosestToContent = listOfHeadingElements[0];

         if( eHeadingElementClosestToContent )
         {
            $title = $("<h1></h1>");
            $title.html( $(eHeadingElementClosestToContent).html() );

            // Prevent dupolicate titles from appearing in the content.
            $(eHeadingElementClosestToContent).addClass( _IGNORE_CLASS );
         }
         else
         {
            $title = $();
         }
      }

      return $title;
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleParser.prototype._getContent = function( $contentContainer )
   {
      var $result = $();

      if( $contentContainer.length > 0 )
      {
         // Note: clone() doesn't clone the computed style. Need to traverse
         //       the original container to analyze their styles.

         var $contentContainerClone = $contentContainer.clone();

         this._restoreSeparatedParagraphs( $contentContainer,
                                           $contentContainerClone );

         var listOfExistingElements = [ $contentContainer[0] ];
         var listOfClonedElements = [ $contentContainerClone[0] ];

         while( listOfClonedElements.length > 0 )
         {
            var eExistingElement = listOfExistingElements.shift();
            var eClonedElement = listOfClonedElements.shift();

            if(    eExistingElement !== $contentContainer[0]
                && this._shouldIgnoreElement( eExistingElement ) )
            {
               $(eClonedElement).remove();
            }
            else
            {
               var isRemoved = this._sanitizeElement( eClonedElement );
               if( !isRemoved )
               {
                  if( eClonedElement.childNodes.length ===
                      eExistingElement.childNodes.length )
                  {
                     for( var i = 0; i < eClonedElement.childNodes.length; i++ )
                     {
                        listOfExistingElements.push( eExistingElement.childNodes[i] );
                        listOfClonedElements.push( eClonedElement.childNodes[i] );
                     }
                  }
               }
            }
         }

         // Use appendChild() instead of $.append() to add the content instead
         // to prevent runtime errors.

         $result = $("<div></div>");
         $result[0].appendChild( $contentContainerClone[0] );
      }

      return $result;
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleParser.prototype._restoreSeparatedParagraphs = function( $contentContainer,
                                                                   $contentContainerClone )
   {
      // Handle the special cases where the article content is split into
      // two separate containers.

      var isSplitIntoTwoContainers = false;
      var listOfContainers = [ $contentContainer, $contentContainer.parent() ];

      for( var i = 0; i < listOfContainers.length && !isSplitIntoTwoContainers; i++ )
      {
         var $container = listOfContainers[i];
         var sClassAttr = $container.attr( "class" );
         var listOfClassNames = sClassAttr ? sClassAttr.split( " " ) : [];

         for( var j = 0; j < listOfClassNames.length && !isSplitIntoTwoContainers; j++ )
         {
            var sClassName = listOfClassNames[j];

            if(    Util.hasSubstringCaseInsensitive( sClassName, "article" )
                && Util.hasSubstringCaseInsensitive( sClassName, "body" ) )
            {
               var $splitContentContainer = $container.siblings( "." + sClassName );
               var $separatedParagraphs = $splitContentContainer.find( "p" );

               if(    $splitContentContainer.length === 1
                   && $separatedParagraphs.length > 0 )
               {
                  isSplitIntoTwoContainers = true;

                  $separatedParagraphs.each( function( iIndex, eParagraph )
                  {
                     var $clonedParagraph = $(eParagraph).clone();
                     $contentContainerClone.prepend( $clonedParagraph );

                     // Need to make sure the original content container has
                     // the same number of elements as the clone.
                     var $clonedParagraph2 = $(eParagraph).clone();
                     $clonedParagraph2.css( "display", "none" );
                     $contentContainer.prepend( $clonedParagraph2 );
                  });
               }
            }
         }
      }
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleParser.prototype._sanitizeElement = function( eElement )
   {
      if( eElement )
      {
         eElement.id        = "";
         eElement.className = "";

         if( eElement.removeAttribute )
         {
            eElement.removeAttribute( "style" );
            eElement.removeAttribute( "width" );
            eElement.removeAttribute( "height" );
         }
      }
   };



   ////////////////////////////////////////////////////////////////////////////

   ArticleParser.prototype._sanitizeElementAndDesendants = function( element )
   {
      var eElement = ( element instanceof $ ) ? element[0] : element;

      if( eElement )
      {
         var listOfElements = [ eElement ];

         while( listOfElements.length > 0 )
         {
            var e = listOfElements.shift();

            this._sanitizeElement( e );

            for( var i = 0; i < e.childNodes.length; i++ )
            {
               listOfElements.push( e.childNodes[i] );
            }
         }
      }
   };



})();


