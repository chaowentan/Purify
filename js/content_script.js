(function()
{
   "use strict";

   chrome.extension.onMessage.addListener( function( sMessage, oSender, fResponseCallback )
   {
      if( sMessage === "Purify" )
      {
         (new ArticleView()).activate();
      }
   });

})();



