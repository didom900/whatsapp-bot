/**
 * web socket integration file
 *
 * In this file are stored all settings for connect the whatsapp api with audara web sockets
 * 
 */
  
if (!window.Store) {
    (function() {
        function getStore(modules) {
            let foundCount = 0;
            let neededObjects = [
                { id: "Store", conditions: (module) => (module.Chat && module.Msg) ? module : null },
                { id: "Wap", conditions: (module) => (module.createGroup) ? module : null },
                { id: "MediaCollection", conditions: (module) => (module.default && module.default.prototype && module.default.prototype.processFiles !== undefined) ? module.default : null },
                { id: "WapDelete", conditions: (module) => (module.sendConversationDelete && module.sendConversationDelete.length == 2) ? module : null },
                { id: "Conn", conditions: (module) => (module.default && module.default.ref && module.default.refTTL) ? module.default : null },
                { id: "WapQuery", conditions: (module) => (module.queryExist) ? module : null },
                { id: "ProtoConstructor", conditions: (module) => (module.prototype && module.prototype.constructor.toString().indexOf('binaryProtocol deprecated version') >= 0) ? module : null },
                { id: "UserConstructor", conditions: (module) => (module.default && module.default.prototype && module.default.prototype.isServer && module.default.prototype.isUser) ? module.default : null }
            ];

            for (let idx in modules) {
                if ((typeof modules[idx] === "object") && (modules[idx] !== null)) {
                    let first = Object.values(modules[idx])[0];
                    if ((typeof first === "object") && (first.exports)) {
                        for (let idx2 in modules[idx]) {
                            let module = modules(idx2);
                            if (!module) {
                                continue;
                            }

                            neededObjects.forEach((needObj) => {
                                if(!needObj.conditions || needObj.foundedModule) return;
                                let neededModule = needObj.conditions(module);
                                if(neededModule !== null) {
                                    foundCount++;
                                    needObj.foundedModule = neededModule;
                                }
                            });

                            if(foundCount == neededObjects.length) {
                                break;
                            }
                        }

                        let neededStore = neededObjects.find((needObj) => needObj.id === "Store");
                        window.Store = neededStore.foundedModule ? neededStore.foundedModule : {};
                        neededObjects.splice(neededObjects.indexOf(neededStore), 1);
                        neededObjects.forEach((needObj) => {
                            if(needObj.foundedModule) {
                                window.Store[needObj.id] = needObj.foundedModule;
                            }
                        });

                        return window.Store;
                    }
                }
            }
        }

        webpackJsonp([], {'parasite': (x, y, z) => getStore(z)}, 'parasite');
    })();
}

/**
 * Declaring global variables
 *
 * This header is used to declare an overview of variables what is contained in the file
 *
 */

window.API = {
    components: {}
};

var wsocket;
var livechat = {};
	livechat['user'] = {};
	livechat['pass'] = {};
	livechat['selectedCampaign'] = {};
var key = CryptoJS.enc.Utf8.parse("KvZeyF47HFcX57Hm");
var iv  = CryptoJS.enc.Utf8.parse("GKwucT42CYQb6ndH");

/**
 * Web Socket Methods
 *
 * These methods can be implemented for manage de complete environment of socket jobs.
 *
 */

window.API.functions = {
    connect: function (serial) {
		var lvc = this;
		window[serial] = new WebSocket('wss://socket.facebook.com:8443/socialchat');
		window[serial].onopen = lvc.onOpen;
		window[serial].onmessage = lvc.onMessage;
        window[serial].onerror = lvc.onError;
		window[serial].onclose = lvc.onClose;
    },
	onOpen: function () {
		var message = {
            command: 'SESSION_REQUEST',
            code: '71000',
			message:{
				userid: livechat.serial
			}
        };
		var io = 'id_'+livechat.wuser;
        window.API.sendMessage(message, io);
	},
	onClose: function (id) {
		console.log("WS: Cerrado :: ", id);
		wsocket = "";
	},
	onError: function (error) {
		console.log("WS: ", error);
	},
	onMessage: function (message) {
		message = window.API.decrypt(message.data);		
		var parsedMessage = JSON.parse(message);
		switch (parsedMessage.id) {
			case 'error':
				console.log('WS error: ', parsedMessage.message);
			break;
			default:
				var idSession = parsedMessage.message.socialid.split('@')
                switch (parsedMessage.command) {
					case 'SESSION_RESPONSE'://Response Session Message
						localStorage.setItem(''+idSession[0]+'@session', parsedMessage.message.session);
						localStorage.setItem(''+idSession[0]+'@sessionClient', parsedMessage.message.sessionClient);
						window.API.getCampaigns(idSession[0]);
						delete livechat["serial"];
					break;
					case 'CAMPAIGN_RESPONSE'://Campaign Response Message						
						var choice='';
						parsedMessage.parameters.campaigns.forEach(function(value, index){							
							choice += '*'+index+'.* '+value.label+'\n';
						});						
						livechat.campaigns = parsedMessage.parameters.campaigns;
						window.WAPI.sendMessage2(parsedMessage.message.socialid, 'Selecciona una opcion para continuar:\n\n'+choice);
						localStorage.setItem(''+idSession[0]+'@campaigns', true);
					break;
					case 'UNAVAILABLE_AGENTS'://Unailable agents for answer the request	
						window.WAPI.sendMessage2(parsedMessage.message.socialid, parsedMessage.message.message, function(){
							var option = {
								command: 'END_CONVERSATION',
								code: '71009',
								message:{
									session: localStorage.getItem(''+parsedMessage.message.session+'@session'),
									sessionClient:localStorage.getItem(''+parsedMessage.message.session+'@sessionClient')
								}
							};	
							window.API.sendMessage(option, 'id_'+idSession[0]);	
							window.API.clean(idSession[0]);
						});						
					break;
					case 'ENTERQUEUE'://The chat request has entered to queue
						window.WAPI.sendMessage2(parsedMessage.message.socialid, parsedMessage.message.greeting);
					break;
					case 'CONNECT'://The chat request has been accepted
						window.WAPI.sendMessage2(parsedMessage.message.socialid, '_El agente '+parsedMessage.message.agentname+' se ha unido a la conversación._');
						localStorage.setItem(''+idSession[0]+'@connected', true);
						localStorage.setItem(''+idSession[0]+'@logged', true);
						localStorage.setItem(''+idSession[0]+'@rating', true);
						livechat[idSession[0]].agentnum = parsedMessage.message.agentnum;
						livechat[idSession[0]].agentname = parsedMessage.message.agentname;
						livechat[idSession[0]].livechatid = parsedMessage.message.livechatid;
						livechat[idSession[0]].chathistory = parsedMessage.message.chathistory;
					break;
					case 'MESSAGE_TO_USER'://New message from agent to user
						if( window.localStorage.getItem(''+idSession[0]+'@locked') != null ){
							return false;
						}
						window.WAPI.sendMessage2(parsedMessage.message.socialid, parsedMessage.message.chatmsg);
					break;
					case 'COMPLETEAGENT'://The agent has ended the conversation
						window.WAPI.sendMessage2(parsedMessage.message.socialid, parsedMessage.message.message, function(){
							if( window.localStorage.getItem(''+idSession[0]+'@rating') != null ){
								window.WAPI.sendMessage2(parsedMessage.message.socialid, '_Por favor ingresa un número del 1 al 5 para calificar al agente_\n ⭐⭐⭐⭐⭐', function(){
									localStorage.setItem(''+idSession[0]+'@locked', true);
									setTimeout(function(){
										var option = {
											command: 'END_CONVERSATION',
											code: '71009',
											message:{
												session: localStorage.getItem(''+parsedMessage.message.session+'@session'),
												sessionClient:localStorage.getItem(''+parsedMessage.message.session+'@sessionClient')
											}
										};	
										window.API.sendMessage(option, 'id_'+idSession[0]);	
										window.API.clean(idSession[0]);
									}, 300000);
								});
							}	
						});		
					break;
					case 'END_CONVERSATION_RESPONSE'://This message is the answer of end conversation request
						window.WAPI.sendMessage2(parsedMessage.message.socialid, window.MESSAGE.regard, function(){
							window['id_'+idSession].close(parsedMessage.message.socialid);						
							API.clean(idSession[0]);
						});
					break;
					case 'INACTIVITY'://According to inactivity settings the chat will end by no user activity
						window.WAPI.sendMessage2(parsedMessage.message.socialid, parsedMessage.message.message, function(){
							if( window.localStorage.getItem(''+idSession[0]+'@rating') != null ){
								window.WAPI.sendMessage2(parsedMessage.message.socialid, '_Por favor ingresa un número del 1 al 5 para calificar al agente_\n ⭐⭐⭐⭐⭐', function(){
									localStorage.setItem(''+idSession[0]+'@locked', true);
									setTimeout(function(){
										var option = {
											command: 'END_CONVERSATION',
											code: '71009',
											message:{
												session: localStorage.getItem(''+parsedMessage.message.session+'@session'),
												sessionClient:localStorage.getItem(''+parsedMessage.message.session+'@sessionClient')
											}
										};	
										window.API.sendMessage(option, 'id_'+idSession[0]);	
										window.API.clean(idSession[0]);
									}, 300000);
								});								
							}
						});												
					break;				
					case 'AGENT_RATING_RESPONSE'://This is the response of agent rating message
						localStorage.removeItem(""+idSession[0]+"@rating");
						window.WAPI.sendMessage2(parsedMessage.message.socialid, 'Calificación registrada con exito!', function(){
							var option = {
							command: 'END_CONVERSATION',
								code: '71009',
								message:{
									session: localStorage.getItem(''+idSession[0]+'@session'),
									sessionClient:localStorage.getItem(''+idSession[0]+'@sessionClient')
								}
							};	
							if( wsocket !== "" ){
								window.API.sendMessage(option, 'id_'+idSession[0]);
							}		
							window.API.clean(idSession[0]);
						});
						break;
					case 'AGENT_SEND_FILE'://The agent sent a file to user
						var newUrl = parsedMessage.message.fileurl.replace("https://172.16.9.7/", "https://img.cdninstagram.com/");
						window.WAPI.base64ImageUrl(newUrl, function(result){
							window.WAPI.sendImage(result, parsedMessage.message.socialid, parsedMessage.message.filename, parsedMessage.message.filename, function(){
								console.log("file sent");
							});
						});
						break;
					case 'DUPLICATE_LOGIN'://Another user has been logged with the same credentials, only the last logged in will be connected
							window.WAPI.sendMessage2(parsedMessage.message.socialid, '_Otro usuario ingreso con estas credenciales_', function(){
								window.API.clean(idSession[0]);
							});
						break;
					case 'LOGIN_STATE'://this is the result of send login request
						if( parsedMessage.message.state === 'false' ){
							window.WAPI.sendMessage2(parsedMessage.message.socialid, '_Los datos ingresados son incorrectos._', function(){
								window.API.clean(idSession[0]);														
							});
						}else{
							API.chatRequest(livechat['selectedCampaign'][idSession[0]], idSession[0], livechat['user'][idSession[0]], parsedMessage.message.userid);								
						}						
						break;
					default:
					break;
				}
			break;
		}
	}
}

/**
 * Encrypt Function
 *
 * This method encrypt the parameter of functions handling with default set up for aes class
 *
 */

window.API.encrypt = function(text){
   var encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(text), 
    key, { keySize: 128 / 8, iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }); 
    encrypted = CryptoJS.enc.Hex.stringify(encrypted.ciphertext);
	return encrypted;
}

/**
 * Decrypt Function
 *
 * This method decrypt the parameter of functions handling with default set up for aes class
 *
 */

window.API.decrypt = function(encrypted){
	var decrypted = CryptoJS.AES.decrypt(CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(encrypted)),
    key, { keySize: 128 / 8, iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }); 
	return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * Register Function
 *
 * This method register the first interaction of user with DIS component
 * 
 * @param data This parameter contain the object received by inject file
 *
 */

window.API.register = function(data){
	var id = data.chatId.user;
	if( typeof livechat.id === 'undefined' ){
		livechat[data.chatId.user] = data.from._serialized;
	}
}

/**
 * Start Function
 *
 * This method start the ws connection
 * 
 * @param data This parameter contain the object received by inject file
 *
 */

window.API.start = function(data){
	livechat.serial = data.from._serialized;
	livechat.wuser = data.from.user;
	window.API.functions.connect('id_'+data.from.user);
}

/**
 * CompareCampaigns Function
 *
 * This method check if campaign has anonymous or registered variable
 * 
 * @param data This parameter contain the object received by inject file
 *
 */

window.API.compareCampaigns = function(data){
	var compare = livechat.campaigns[data.body];
	livechat['selectedCampaign'] = { [data.chatId.user]:compare.name };
	if( compare.type == 'authenticate' ){
		localStorage.setItem(''+data.chatId.user+'@authenticate', true);
		window.WAPI.sendMessage2(data.from._serialized, '_Ingresa el usuario para hacer la autenticación._');
	}else{
		API.chatRequest(compare.name, data.chatId.user, data.sender.pushname);	
	}	
}

/**
 * GetCampaigns Function
 *
 * This method get the array of campaings 
 * 
 * @param id Phone number of requested user
 *
 */

window.API.getCampaigns = function(id){
	var message = {
		command: 'CAMPAIGN_REQUEST',
		code: '71002',
		message:{
				group: 'default',
				session: localStorage.getItem(''+id+'@session'),
				sessionClient:localStorage.getItem(''+id+'@sessionClient')
			}			
	};
	window.API.sendMessage(message, 'id_'+id);
}

/**
 * GetCampaigns Function
 *
 * This method get the array of campaings 
 * 
 * @param queue campaign selected by user
 * @param phone phone number of user
 * @param user  user who request the chat
 * @param userid id user who request the chat
 *
 */

window.API.chatRequest = function(queue, phone, user, userid = null){
	var message = {
		command: 'CHAT_REQUEST',
		code: '71003',
		message:{
			livechat: queue,	
			name: user,
			source: 'whatsapp',
			request: 'Prueba Integración Whatsapp',
			customerphone: phone,
			session: localStorage.getItem(''+phone+'@session'),
			sessionClient:localStorage.getItem(''+phone+'@sessionClient')
		}			
	};
	if( userid !== null ){
		message.message['userid'] = userid;
	}
	window.API.sendMessage(message, 'id_'+phone);
}

/**
 * MessageToAgent Function
 *
 * This method send a message to agent
 * 
 * @param data This parameter contain the object received by inject file
 *
 */

window.API.messageToAgent = function(data){
	var option = {
		command: 'MESSAGE_TO_AGENT',
		code: '71010',
		message:{
			message: data.body,
			session: localStorage.getItem(''+data.chatId.user+'@session'),
			sessionClient:localStorage.getItem(''+data.chatId.user+'@sessionClient')
		}
	};
	window.API.sendMessage(option, 'id_'+data.chatId.user);
}

/**
 * SendFile Function
 *
 * This method send an image to agent (Experimental)
 * 
 * @param data This parameter contain the object received by inject file
 *
 */

window.API.sendFile = function(data){
	var basesc = 'data:'+data.mimetype+';base64,'+data.body;
	var file = window.WAPI.base64ImageToFile(basesc, 'logo_ebay_principal.jpg');
	var form_data = new FormData();
	form_data.append("file", file);
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange=function() {
		if (this.readyState == 4 && this.status == 200) {
			if( this.responseText == 'true' ){
				var Action = {
					id: "USER_SEND_FILE",
					command: "USER_SEND_FILE",
					code: "71035",
					message: {
						session: localStorage.getItem(''+data.chatId.user+'@session'),
						sessionClient: localStorage.getItem(''+data.chatId.user+'@sessionClient'),
						fileurl: 'https://172.16.9.7/apps/livechat/apps/whatsapp/Uploads/logo_ebay_principal.jpg',
						filename: 'logo_ebay_principal.jpg',
						filetoken: 'none',
						filetype : 'jpg'
					}
				};
				window.API.sendMessage(Action, 'id_'+data.chatId.user);
			}
		}
	};
	xhttp.open("POST", "https://img.cdninstagram.com/apps/livechat/apps/whatsapp/upload.php", true);
	xhttp.send(form_data);
}

/**
 * RatingToAgent Function
 *
 * This method rate the chat session
 * 
 * @param data This parameter contain the object received by inject file
 *
 */

window.API.ratingToAgent = function(data){	

	var option = {
	id: "AGENT_RATING",
	command: "AGENT_RATING",
	code: "71024",
		message: {
			agentnum: livechat.agentnum,
			agentname: livechat.agentname,
			comment: "",
			rating: data.body,
			livechatid: livechat.livechatid,
			chathistory: livechat.chathistory,
			userid: "",
			sendmail: "no",
			email: "",
			session: localStorage.getItem(''+data.chatId.user+'@session'),
			sessionClient: localStorage.getItem(''+data.chatId.user+'@sessionClient')
		}
	}
	window.API.sendMessage(option, 'id_'+data.chatId.user);
}

/**
 * SendMessage Function
 *
 * This method send a message to ws connection
 * 
 * @param msg This parameter contain the message to send
 * @param op This parameter has the id of user for check the connection to send the message
 *
 */

window.API.sendMessage = function(msg, op){
 	var jsonMessage = JSON.stringify(msg);
	let encrypted = window.API.encrypt(jsonMessage);
    window[op].send(encrypted);
}

/**
 * EndChat Function
 *
 * This method send end signal to Dis
 * 
 * @param data This parameter contain the object received by inject file
 *
 */

window.API.endChat = function(data){
	if( window.localStorage.getItem(''+data.chatId.user+'@rating') != null ){
		window.WAPI.sendMessage2(data.from._serialized, '_Por favor ingresa un número del 1 al 5 para calificar al agente_\n ⭐⭐⭐⭐⭐', function(){
			localStorage.setItem(''+data.chatId.user+'@locked', true);
			window.localStorage.removeItem(''+data.chatId.user+'@rating')
			setTimeout(function(){
				window.API.endChat(data);
			}, 300000);
		});
	}else{
		var option = {
			command: 'END_CONVERSATION',
			code: '71009',
			message:{
				session: localStorage.getItem(''+data.chatId.user+'@session'),
				sessionClient:localStorage.getItem(''+data.chatId.user+'@sessionClient')
			}
		};	
		if( wsocket !== "" ){
			window.API.sendMessage(option, 'id_'+data.chatId.user);
		}		
		window.API.clean(data.chatId.user);
	}	
}

/**
 * RegisterUser Function
 *
 * This method send end signal to Dis
 * 
 * @param user This parameter contain the user to register session
 * @param pass This parameter contain the password to register session
 * @param data This parameter contain the object received by inject file
 *
 */

window.API.registerUser = function(user, pass, data){
	if( typeof livechat['user'][data.chatId.user] === 'undefined' ){
		livechat['user'] = { [data.chatId.user]:user };
		window.WAPI.sendMessage2(data.from._serialized, '_Ingresa la contraseña de la cuenta._');
		localStorage.setItem(''+data.chatId.user+'@password', true);
		return false;
	}

	if( typeof livechat['pass'][data.chatId.user] === 'undefined' ){
		if (typeof pass !== 'undefined') {
			var message = {
				command: 'REGISTER',
				name: livechat['user'][data.chatId.user],
				number: data.chatId._serialized,
				group: 'gecko',
				type: 'USER'
        	};
        	window.API.sendMessage(message, 'id_'+user);
			
			livechat['pass'] = { [data.chatId.user]:pass };
			var option = {
				command: 'LOGIN',
				code: '71001',
				message:{
					username: livechat['user'][data.chatId.user],
					password: livechat['pass'][data.chatId.user],
					livechat: livechat['selectedCampaign'][data.chatId.user],
					gui: 'HTML5',
					registerform: '1',
					session: localStorage.getItem(''+user+'@session'),
					sessionClient:localStorage.getItem(''+user+'@sessionClient')
				}			
			};
			window.API.sendMessage(option, 'id_'+user);
		}		
	}
}

/**
 * Clean Function
 *
 * This method delete all information related to that ended session
 * 
 * @param idSession This parameter contain the id of user in session
 *
 */

window.API.clean = function(idSession){
	delete livechat['user'][idSession];
	delete livechat['pass'][idSession];
	delete livechat['selectedCampaign'][idSession];
	localStorage.removeItem(""+idSession+"@home");
	localStorage.removeItem(""+idSession+"@campaigns");
	localStorage.removeItem(""+idSession+"@connected");
	localStorage.removeItem(""+idSession+"@session");
	localStorage.removeItem(""+idSession+"@sessionClient");
	localStorage.removeItem(""+idSession+"@authenticate");
	localStorage.removeItem(""+idSession+"@password");
	localStorage.removeItem(""+idSession+"@logged");
	localStorage.removeItem(""+idSession+"@rating");
	localStorage.removeItem(""+idSession+"@locked");	
	window['id_'+idSession].close();
	delete window['id_'+idSession];
}