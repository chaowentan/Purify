

(function()
{
   "use strict";

   window.Util = {};



   ////////////////////////////////////////////////////////////////////////////

   Util.getDistanceBetweenElements = function( eElement1, eElement2 )
   {
      var getPosition = function( eElement )
      {
         var oResult = { "top"  : 0,
                         "left" : 0 };

         while( eElement )
         {
            oResult.top  += eElement.offsetTop;
            oResult.left += eElement.offsetLeft;

            eElement = eElement.offsetParent;
         }

         return oResult;
      };

      var oPosition1 = getPosition( eElement1 );
      var oPosition2 = getPosition( eElement2 );

      var y = oPosition1.top  - oPosition2.top;
      var x = oPosition1.left - oPosition2.left;

      return Math.sqrt( y * y + x * x );
   };



})();



