WAPI.waitNewMessages(false, (data) => {
    data.forEach((message) => {
		/* Only process the no pending messages for avoid the beginning connection sending of unnecesary messagges */
		if( data[0].chat.pendingMsgs === true){
			return false;
		}else{
			if (intents.blocked.indexOf(message.from.user) >= 0) {
				return;
			}
			/* The message received has chat value in type property */
			if (message.type == "chat") {
				/* Conditional for check if locked var is declared */
				if( window.localStorage.getItem(''+data[0].chatId.user+'@locked') !== null ){
					if ( isNaN(data[0].body) ){
						WAPI.sendMessage2(message.from._serialized, 'La sesión ha finalizado, la calificación debe ser ingresada con un valor numérico.');
						return false;
					}else{
						API.ratingToAgent(data[0]);
					}
				}
				/* Conditional for check if this word is sent by user */
				if( data[0].body == 'FINALIZAR' ){
					API.endChat(data[0]);
					return false;
				}
				if( data[0].body == 'AudaraVersion' ){
					WAPI.sendMessage2(message.from._serialized, 'v1.1');
					return false;
				}
				/* Conditional for check if logged var is declared */
				if( window.localStorage.getItem(''+data[0].chatId.user+'@logged') === null ){
					/* Conditional for check if password var is declared */
					if( window.localStorage.getItem(''+data[0].chatId.user+'@password') === null ){
						/* Conditional for check if authenticate var is declared */
						if( window.localStorage.getItem(''+data[0].chatId.user+'@authenticate') !== null ){
							API.registerUser(data[0].body, message, data[0]);
							return false;
						}
					}else{
						API.registerUser(message.chatId.user, data[0].body, data[0]);
						return false;
					}
				}	
				/* Conditional for check if connected var is declared */						
				if( window.localStorage.getItem(''+data[0].chatId.user+'@connected') !== null ){
					API.messageToAgent(data[0]);
					return false;
				}
				/* Conditional for check if campaigns var is declared */				
				if( window.localStorage.getItem(''+data[0].chatId.user+'@campaigns') !== null ){
					API.compareCampaigns(data[0]);
					return false;
				}
				/* Conditional for check if home var is declared */	
				if( window.localStorage.getItem(''+data[0].chatId.user+'@home') !== null ){
					switch(data[0].body){
						case '1':
							API.start(data[0]);
						break;
						case '2':
							WAPI.sendMessage2(message.from._serialized, 'La conversación acaba de Finalizar.', function(){
								API.endChat(data[0]);
							});
						break;										
					}
				}else{
					WAPI.sendMessage2(message.from._serialized, MESSAGE.welcome);
					WAPI.sendMessage2(message.from._serialized, MESSAGE.list);
					window.localStorage.setItem(''+data[0].chatId.user+'@home', true);
					API.register(data[0]);
				}			
			}	
			/* The message received has ptt value in type property */ 
			if (message.type == "ptt") {
				WAPI.sendMessage2(message.from._serialized, "_En este momento no se pueden atender notas de voz._");
			}
			/* The message received has image value in type property */ 
			if (message.type == "image") {
				API.sendFile(data[0]);			
			}		
		}        
    });
});