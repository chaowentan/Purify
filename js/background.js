(function()
{
   var sMenuItemTitle = "Purify";

   chrome.browserAction.onClicked.addListener( function( tab )
   {
      chrome.tabs.sendMessage( tab.id, sMenuItemTitle );
   });

   chrome.contextMenus.create(
   {
      "contexts" : [ "all" ],
      "title"    : sMenuItemTitle,
      "onclick"  : function( info, tab )
      {
         chrome.tabs.sendMessage( tab.id, sMenuItemTitle );
      }
   });

   chrome.extension.onMessage.addListener( function( oRequest, oSender, fSendResponse )
   {
      // If the request is comming from the content script....
      if( oSender.tab )
      {
         if( oRequest.action === "getLocalStorage" )
         {
            if( fSendResponse )
            {
               var name  = oRequest["name"];
               var value = localStorage[ name ];

               var oResponse = {};
               oResponse[ name ] = value;

               fSendResponse( oResponse );
            }
         }
         else if( oRequest.action === "setLocalStorage" )
         {
            localStorage[ oRequest["name"] ] = oRequest["value"];
         }
         else
         {
            // Nothing.
         }
      }

      return true;  // send a response asynchronously
   });

})();


