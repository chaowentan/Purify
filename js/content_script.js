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

   // // Auto-start
   // $(document).ready( function()
   // {
   //    (new ArticleView()).activate();
   // })

})();


